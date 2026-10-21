// MERC-PAI-3: testes dos quatro cards reais do carrossel do mercado
// (CardAltasQuedas, CardLiquidez, CardNegociacao, CardAmplitude) e da
// funcao utilitaria formatarVolume.
import assert from 'node:assert/strict';

// --- stubs globais (mesmo padrao de mercCarrossel.test.mjs) -----------------
globalThis.HTMLElement = class {
  constructor() {
    this._ouvintes = [];
    this.classList = { add() {} };
    this.isConnected = true;
  }
  addEventListener(tipo, fn) { this._ouvintes.push({ tipo, fn }); }
  disparar(tipo, evento) { for (const r of this._ouvintes.filter((o) => o.tipo === tipo)) r.fn(evento); }
};
const definidos = new Map();
globalThis.customElements = {
  define(nome, classe) {
    if (definidos.has(nome)) throw new Error(`NotSupportedError: "${nome}" já foi definido`);
    definidos.set(nome, classe);
  },
  get(nome) { return definidos.get(nome); },
};

// --- imports ----------------------------------------------------------------
const { RankingTickers } = await import('../public/js/components/inicio/RankingTickers.js');
const { cardAltasQuedas } = await import('../public/js/components/inicio/cards/CardAltasQuedas.js');
const { cardLiquidez } = await import('../public/js/components/inicio/cards/CardLiquidez.js');
const { cardNegociacao } = await import('../public/js/components/inicio/cards/CardNegociacao.js');
const { cardAmplitude } = await import('../public/js/components/inicio/cards/CardAmplitude.js');
const { formatarVolume } = await import('../public/js/utils/numero.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos += 1; }

// --- auxiliares -------------------------------------------------------------
await caso('stub de customElements lança em nome duplicado', () => {
  assert.ok(customElements.get('ranking-tickers'));
  assert.throws(() => customElements.define('ranking-tickers', class {}), /já foi definido/);
});

/** Cria um host falso que devolve um RankingTickers real ao ser consultado. */
function criarHost() {
  let ranking = null;
  const host = {
    innerHTML: '',
    querySelector(sel) {
      if (sel === 'ranking-tickers') {
        ranking = new RankingTickers();
        return ranking;
      }
      return null;
    },
  };
  return { host, getRanking: () => ranking };
}

const panoramaBase = () => ({
  janela: '5d',
  dataPregao: '2026-10-20',
  universo: { liquidos: 200 },
  indisponivel: [],
  altas: [{ posicao: 1, simbolo: 'PETR4', variacao: 0.05 }],
  quedas: [{ posicao: 1, simbolo: 'VALE3', variacao: -0.03 }],
  liquidez: {
    maiores: [{ posicao: 1, simbolo: 'ITUB4', volumeMedio63d: 2.1e9, spreadEstimado: 0.0005 }],
    menores: [{ posicao: 1, simbolo: 'XPTO3', volumeMedio63d: 1e5, spreadEstimado: 0.02 }],
  },
  negociacao: {
    maiores: [{ posicao: 1, simbolo: 'ITUB4', volumeFinanceiro: 1.5e9, negocios: 345227 }],
    menores: [{ posicao: 1, simbolo: 'XPTO3', volumeFinanceiro: 5e5, negocios: 42 }],
  },
  amplitude: { subiram: 120, cairam: 55, estaveis: 25, pctAcimaMm21: 0.34 },
});

// --- CardAltasQuedas --------------------------------------------------------
await caso('CardAltasQuedas: renderiza ranking com altas e quedas', async () => {
  const pan = panoramaBase();
  const card = cardAltasQuedas({ buscar: async () => pan });
  assert.equal(card.id, 'altas-quedas');
  assert.equal(card.tituloErro, 'Panorama indisponível');
  const { host, getRanking } = criarHost();
  await card.render(host);
  assert.match(host.innerHTML, /<ranking-tickers>/);
  const ranking = getRanking();
  assert.ok(ranking, 'deve ter criado o ranking-tickers');
  assert.deepEqual(ranking._opcoes.rotulos, { maiores: 'Maiores altas', menores: 'Maiores quedas' });
  assert.equal(ranking._opcoes.direcional, true);
  assert.equal(ranking._opcoes.escalaComum, true);
  assert.deepEqual(ranking._dados.maiores, pan.altas);
  assert.deepEqual(ranking._dados.menores, pan.quedas);
  assert.match(host.innerHTML, /200 ações líquidas/);
});

await caso('CardAltasQuedas: estado vazio quando altas e quedas em indisponivel', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  const pan = { ...panoramaBase(), altas: [], quedas: [], indisponivel: ['altas', 'quedas'] };
  await cardAltasQuedas({ buscar: async () => pan }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.match(host.innerHTML, /ainda sem dado/);
  assert.doesNotMatch(host.innerHTML, /<ranking-tickers>/);
});

await caso('CardAltasQuedas: erro na busca propaga', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  await assert.rejects(
    cardAltasQuedas({ buscar: async () => { throw new Error('HTTP 503'); } }).render(host),
    /HTTP 503/,
  );
});

// --- CardLiquidez -----------------------------------------------------------
await caso('CardLiquidez: renderiza ranking de liquidez com aviso e rodapé', async () => {
  const pan = panoramaBase();
  const card = cardLiquidez({ buscar: async () => pan });
  assert.equal(card.id, 'liquidez');
  const { host, getRanking } = criarHost();
  await card.render(host);
  assert.match(host.innerHTML, /<ranking-tickers>/);
  assert.match(host.innerHTML, /volume médio de 63 pregões/);
  assert.match(host.innerHTML, /Não muda com o seletor de período/);
  const ranking = getRanking();
  assert.ok(ranking);
  assert.deepEqual(ranking._opcoes.rotulos, { maiores: 'Mais líquidas', menores: 'Menos líquidas' });
  assert.equal(ranking._opcoes.direcional, false);
  // Verifica valor e formatar
  const item = { volumeMedio63d: 2.1e9 };
  assert.equal(ranking._opcoes.formatar(item), 'R$ 2,1 B');
  assert.equal(ranking._opcoes.valor(item), 2.1e9);
});

await caso('CardLiquidez: selos de spread via campo setor', async () => {
  const pan = panoramaBase();
  const { host, getRanking } = criarHost();
  await cardLiquidez({ buscar: async () => pan }).render(host);
  const ranking = getRanking();
  // ITUB4: spreadEstimado 0.0005 <= 0.001 → boa para operar
  assert.match(ranking._dados.maiores[0].setor, /boa para operar/);
  // XPTO3: spreadEstimado 0.02 >= 0.01 → cuidado com spread
  assert.match(ranking._dados.menores[0].setor, /cuidado com spread/);
});

await caso('CardLiquidez: estado vazio quando liquidez em indisponivel', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  const pan = { ...panoramaBase(), indisponivel: ['liquidez'] };
  await cardLiquidez({ buscar: async () => pan }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.doesNotMatch(host.innerHTML, /<ranking-tickers>/);
});

await caso('CardLiquidez: erro na busca propaga', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  await assert.rejects(
    cardLiquidez({ buscar: async () => { throw new Error('timeout'); } }).render(host),
    /timeout/,
  );
});

// --- CardNegociacao ---------------------------------------------------------
await caso('CardNegociacao: renderiza ranking de negociacao com contagem de negocios', async () => {
  const pan = panoramaBase();
  const { host, getRanking } = criarHost();
  await cardNegociacao({ buscar: async () => pan }).render(host);
  assert.match(host.innerHTML, /<ranking-tickers>/);
  const ranking = getRanking();
  assert.ok(ranking);
  assert.deepEqual(ranking._opcoes.rotulos, { maiores: 'Mais negociadas', menores: 'Menos negociadas' });
  assert.equal(ranking._opcoes.direcional, false);
  const item = { volumeFinanceiro: 1.5e9 };
  assert.equal(ranking._opcoes.formatar(item), 'R$ 1,5 B');
  assert.equal(ranking._opcoes.valor(item), 1.5e9);
  // negocios na campo setor
  assert.match(ranking._dados.maiores[0].setor, /345\.227 negócios/);
});

await caso('CardNegociacao: estado vazio quando negociacao em indisponivel', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  const pan = { ...panoramaBase(), indisponivel: ['negociacao'] };
  await cardNegociacao({ buscar: async () => pan }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.doesNotMatch(host.innerHTML, /<ranking-tickers>/);
});

await caso('CardNegociacao: erro na busca propaga', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  await assert.rejects(
    cardNegociacao({ buscar: async () => { throw new Error('HTTP 500'); } }).render(host),
    /HTTP 500/,
  );
});

// --- CardAmplitude ----------------------------------------------------------
await caso('CardAmplitude: renderiza tres numeros e percentual acima da media', async () => {
  const pan = panoramaBase();
  const host = { innerHTML: '', querySelector: () => null };
  await cardAmplitude({ buscar: async () => pan }).render(host);
  assert.match(host.innerHTML, /120/);   // subiram
  assert.match(host.innerHTML, /55/);    // cairam
  assert.match(host.innerHTML, /25/);    // estaveis
  assert.match(host.innerHTML, /subiram/);
  assert.match(host.innerHTML, /caíram/);
  assert.match(host.innerHTML, /estáveis/);
  assert.match(host.innerHTML, /34%/);
  assert.match(host.innerHTML, /média de 21 pregões/);
  assert.doesNotMatch(host.innerHTML, /<ranking-tickers>/);
  assert.match(host.innerHTML, /200 ações líquidas/);
});

await caso('CardAmplitude: estado vazio quando amplitude em indisponivel', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  const pan = { ...panoramaBase(), indisponivel: ['amplitude'] };
  await cardAmplitude({ buscar: async () => pan }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.doesNotMatch(host.innerHTML, /subiram/);
});

await caso('CardAmplitude: erro na busca propaga', async () => {
  const host = { innerHTML: '', querySelector: () => null };
  await assert.rejects(
    cardAmplitude({ buscar: async () => { throw new Error('falha amplitude'); } }).render(host),
    /falha amplitude/,
  );
});

// --- formatarVolume ---------------------------------------------------------
await caso('formatarVolume: casos de fronteira', () => {
  assert.equal(formatarVolume(0), 'R$ 0');
  assert.equal(formatarVolume(999999), 'R$ 999.999');
  assert.equal(formatarVolume(1e6), 'R$ 1,0 M');
  assert.equal(formatarVolume(2.1e9), 'R$ 2,1 B');
});

console.log(`mercCards.test.mjs ok (${casos} casos)`);
