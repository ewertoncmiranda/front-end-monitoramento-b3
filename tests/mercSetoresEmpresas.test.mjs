// MERC-PAI-2: panoramaMercado.js (funcoes puras) + CardSetoresEmpresas (card do
// carrossel). Sem DOM real: stubs de HTMLElement e customElements (padrao
// mercCarrossel.test.mjs).
import assert from 'node:assert/strict';

// --- stubs globais -------------------------------------------------------
globalThis.HTMLElement = class {
  constructor() {
    this._ouvintes = [];
    this.classList = { add() {} };
    this.isConnected = true;
    this.innerHTML = '';
  }
  addEventListener(tipo, fn) { this._ouvintes.push({ tipo, fn }); }
  disparar(tipo, evento) { for (const r of this._ouvintes.filter((o) => o.tipo === tipo)) r.fn(evento); }
  getAttribute() { return null; }
  querySelectorAll() { return []; }
};

const definidos = new Map();
globalThis.customElements = {
  define(nome, classe) {
    if (definidos.has(nome)) throw new Error(`NotSupportedError: "${nome}" já foi definido`);
    definidos.set(nome, classe);
  },
  get(nome) { return definidos.get(nome); },
};

const {
  textoSelo,
  escalaBarras,
  estadoVazioBloco,
  setoresOrdenados,
  formatarDesvio,
} = await import('../public/js/analise/panoramaMercado.js');

const { RankingTickers } = await import('../public/js/components/inicio/RankingTickers.js');
const { cardSetoresEmpresas } = await import('../public/js/components/inicio/cards/CardSetoresEmpresas.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos += 1; }

// =========================================================================
// panoramaMercado.js — funcoes puras
// =========================================================================

await caso('stub de customElements lanca em nome duplicado, como o navegador', () => {
  assert.ok(customElements.get('ranking-tickers'));
  assert.throws(() => customElements.define('ranking-tickers', class {}), /já foi definido/);
});

await caso('textoSelo: JUNTO, DISPERSO, MISTO e valor desconhecido', () => {
  assert.equal(textoSelo('JUNTO'), 'andou junto');
  assert.equal(textoSelo('DISPERSO'), 'disperso');
  assert.equal(textoSelo('MISTO'), 'misto');
  assert.equal(textoSelo('OUTRO'), 'misto');
  assert.equal(textoSelo(null), 'misto');
  assert.equal(textoSelo(undefined), 'misto');
});

await caso('escalaBarras: max abs, lista vazia retorna 1, todos zero retorna 1', () => {
  assert.equal(escalaBarras([{ v: 0.1 }, { v: -0.3 }, { v: 0.2 }], (i) => i.v), 0.3);
  assert.equal(escalaBarras([], (i) => i.v), 1);
  assert.equal(escalaBarras(null, (i) => i.v), 1);
  assert.equal(escalaBarras([{ v: 0 }, { v: 0 }], (i) => i.v), 1, 'todos zero -> 1');
  assert.equal(escalaBarras([{ v: -0.05 }], (i) => i.v), 0.05);
});

await caso('estadoVazioBloco: presente, ausente, indisponivel nao-array', () => {
  assert.equal(estadoVazioBloco(['setores', 'altas'], 'setores'), true);
  assert.equal(estadoVazioBloco(['altas'], 'setores'), false);
  assert.equal(estadoVazioBloco([], 'setores'), false);
  assert.equal(estadoVazioBloco(null, 'setores'), false);
  assert.equal(estadoVazioBloco('setores', 'setores'), false, 'string nao e array');
});

await caso('setoresOrdenados: Outros por ultimo, ordenacao decrescente, empate estavel', () => {
  const setores = [
    { nome: 'Outros', variacaoMediana: 0.05 },
    { nome: 'Bancos', variacaoMediana: 0.03 },
    { nome: 'Varejo', variacaoMediana: 0.07 },
    { nome: 'Energia', variacaoMediana: -0.01 },
  ];
  const resultado = setoresOrdenados(setores);
  assert.equal(resultado[resultado.length - 1].nome, 'Outros', '"Outros" por ultimo');
  assert.equal(resultado[0].nome, 'Varejo', 'maior variacao primeiro');
  assert.equal(resultado[1].nome, 'Bancos');
  assert.equal(resultado[2].nome, 'Energia');

  // Empate: ordem original preservada (sort estavel)
  const empate = [
    { nome: 'A', variacaoMediana: 0.01 },
    { nome: 'B', variacaoMediana: 0.01 },
  ];
  const [a, b] = setoresOrdenados(empate);
  assert.equal(a.nome, 'A');
  assert.equal(b.nome, 'B');

  // Lista vazia
  assert.deepEqual(setoresOrdenados([]), []);
  assert.deepEqual(setoresOrdenados(null), []);

  // Apenas Outros
  const [o] = setoresOrdenados([{ nome: 'Outros', variacaoMediana: 0.1 }]);
  assert.equal(o.nome, 'Outros');
});

await caso('formatarDesvio: positivo, negativo, zero, null', () => {
  assert.equal(formatarDesvio(0.0123), '+1,23 pp');
  assert.equal(formatarDesvio(-0.0045), '-0,45 pp');
  assert.equal(formatarDesvio(0), '+0,00 pp');
  assert.equal(formatarDesvio(null), '+0,00 pp');
  assert.equal(formatarDesvio(undefined), '+0,00 pp');
  // Numero grande
  assert.equal(formatarDesvio(0.1), '+10,00 pp');
});

// =========================================================================
// CardSetoresEmpresas — testes do card
// =========================================================================

const criarSetor = (nome, variacaoMediana, selo = 'JUNTO', opts = {}) => ({
  nome,
  variacaoMediana,
  universo: { liquidos: opts.liquidos ?? 5 },
  selo,
  melhores: opts.melhores ?? [{ simbolo: `${nome.slice(0, 3).toUpperCase()}4`, nome: `Empresa Top ${nome}`, desvio: 0.012 }],
  piores: opts.piores ?? [{ simbolo: `${nome.slice(0, 3).toUpperCase()}3`, nome: `Empresa Bot ${nome}`, desvio: -0.008 }],
});

const panoramaBase = () => ({
  janela: '5d',
  dataPregao: '2026-10-20',
  universo: { liquidos: 196 },
  indisponivel: [],
  setores: [
    criarSetor('Bancos', 0.023, 'JUNTO', { liquidos: 8 }),
    criarSetor('Varejo', 0.007, 'MISTO', { liquidos: 12 }),
    criarSetor('Outros', 0.001, 'DISPERSO', { liquidos: 15 }),
  ],
});

// Host simples: apenas armazena innerHTML e listeners (para testes de render)
function criarHostSimples() {
  return {
    innerHTML: '',
    _ouvintes: [],
    addEventListener(tipo, fn) { this._ouvintes.push({ tipo, fn }); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
  };
}

await caso('card: mock de buscarPanorama → renderiza lista de setores', async () => {
  const panorama = panoramaBase();
  const card = cardSetoresEmpresas({ buscar: async () => panorama });
  const host = criarHostSimples();
  await card.render(host);

  assert.match(host.innerHTML, /Bancos/, 'setor Bancos presente');
  assert.match(host.innerHTML, /Varejo/, 'setor Varejo presente');
  assert.match(host.innerHTML, /Outros/, 'setor Outros presente');
  assert.match(host.innerHTML, /data-expandir-setor/, 'botoes de expansao');
  assert.match(host.innerHTML, /ranking-tickers/, 'elementos ranking-tickers');
  assert.match(host.innerHTML, /andou junto/, 'selo textoSelo("JUNTO")');
  assert.match(host.innerHTML, /pregão de/, 'rodape com data do pregao');
  // Outros por ultimo
  const idxBancos = host.innerHTML.indexOf('>Bancos<');
  const idxOutros = host.innerHTML.indexOf('>Outros<');
  assert.ok(idxBancos < idxOutros, '"Outros" aparece depois de "Bancos"');
  // Chips apenas para nao-Outros
  assert.match(host.innerHTML, /BAN4/, 'chip melhor para Bancos');
  // Outros nao deve ter chips
  const posOutros = host.innerHTML.indexOf('>Outros<');
  const proximoLi = host.innerHTML.indexOf('</li>', posOutros);
  const trecho = host.innerHTML.slice(posOutros, proximoLi);
  assert.doesNotMatch(trecho, /text-bg-success/, '"Outros" sem chip melhor');
  assert.doesNotMatch(trecho, /text-bg-danger/, '"Outros" sem chip pior');
});

await caso('card: bloco em indisponivel → estado vazio', async () => {
  const host = criarHostSimples();
  await cardSetoresEmpresas({
    buscar: async () => ({ ...panoramaBase(), indisponivel: ['setores'] }),
  }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.match(host.innerHTML, /ainda sem dado/);
});

await caso('card: setores vazio → estado vazio', async () => {
  const host = criarHostSimples();
  await cardSetoresEmpresas({
    buscar: async () => ({ janela: '5d', setores: [], indisponivel: [] }),
  }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
});

await caso('card: erro no gestor → render lanca (carrossel isola)', async () => {
  await assert.rejects(
    cardSetoresEmpresas({
      buscar: async () => { throw new Error('HTTP 503'); },
    }).render(criarHostSimples()),
    /503/,
  );
});

await caso('card: clique expande setor e configura ranking-tickers', async () => {
  const panorama = panoramaBase();
  const card = cardSetoresEmpresas({ buscar: async () => panorama });

  // Host que simula querySelector/querySelectorAll apos o render
  const ouvintes = [];
  const botoes = [0, 1, 2].map((i) => ({
    dataset: { expandirSetor: String(i) },
    _attrs: { 'aria-expanded': 'false' },
    getAttribute(k) { return this._attrs[k] ?? null; },
    setAttribute(k, v) { this._attrs[k] = String(v); },
  }));
  const rankings = [0, 1, 2].map(() => {
    const rt = new RankingTickers();
    rt.isConnected = false;
    return {
      hidden: true,
      _rt: rt,
      querySelector(sel) { return sel.includes('ranking-tickers') ? rt : null; },
    };
  });

  const host = {
    innerHTML: '',
    addEventListener(tipo, fn) { ouvintes.push({ tipo, fn }); },
    querySelector(sel) {
      const m = /\[data-ranking-setor="(\d+)"\]/.exec(sel);
      if (m) return rankings[Number(m[1])];
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '[data-expandir-setor]') return botoes;
      if (sel === '[data-ranking-setor]') return rankings;
      return [];
    },
  };

  await card.render(host);
  assert.ok(ouvintes.some((o) => o.tipo === 'click'), 'listener de click registrado');

  // Simula clique no setor 0 (Bancos, apos ordenacao: idx 0 = maior variacao)
  const clicar = (idx) => {
    const evento = {
      target: {
        closest(sel) { return sel.includes('data-expandir-setor') ? botoes[idx] : null; },
      },
    };
    for (const r of ouvintes.filter((o) => o.tipo === 'click')) r.fn(evento);
  };

  clicar(0);
  assert.equal(botoes[0].getAttribute('aria-expanded'), 'true', 'botao 0 expandido');
  assert.equal(rankings[0].hidden, false, 'ranking 0 visivel');
  assert.equal(rankings[1].hidden, true, 'ranking 1 ainda oculto');

  // Dados configurados no ranking-tickers
  const rt0 = rankings[0]._rt;
  assert.ok(rt0._dados, 'dados atribuidos ao ranking-tickers');

  // Clique em outro setor colapsa o primeiro
  clicar(1);
  assert.equal(botoes[0].getAttribute('aria-expanded'), 'false', 'botao 0 colapsado');
  assert.equal(rankings[0].hidden, true, 'ranking 0 oculto apos novo clique');
  assert.equal(botoes[1].getAttribute('aria-expanded'), 'true', 'botao 1 expandido');

  // Segundo clique no mesmo setor colapsa
  clicar(1);
  assert.equal(botoes[1].getAttribute('aria-expanded'), 'false', 'segundo clique colapsa');
  assert.equal(rankings[1].hidden, true, 'ranking 1 oculto apos colapso');
});

await caso('DTO real: setor e empresas aparecem; nomes e selo ganham ajuda sem botões aninhados', async () => {
  const host = criarHostSimples();
  await cardSetoresEmpresas({ buscar: async () => ({ janela: '5d', dataInicial: '2026-10-13', dataPregao: '2026-10-19', setores: [
    { setor: 'Telecomunicações', empresas: 3, variacaoMediana: 0.037, coesao: 2 / 3, selo: 'MISTO', melhores: [], piores: [] },
    { setor: 'Outros', empresas: 7, variacaoMediana: 0.2, selo: 'JUNTO', melhores: [{ simbolo: 'ABC3' }], piores: [] },
  ] }) }).render(host);
  assert.match(host.innerHTML, />Telecomunicações</);
  assert.match(host.innerHTML, /3 ações/);
  assert.match(host.innerHTML, /66,7% das ações/);
  assert.match(host.innerHTML, /13\/10\/2026 a 19\/10\/2026/);
  assert.match(host.innerHTML, /mediana/);
  assert.match(host.innerHTML, /pontos percentuais/);
  assert.match(host.innerHTML, /Não é aumento de lucro/);
  assert.doesNotMatch(host.innerHTML, /ABC3/);
  for (const botao of host.innerHTML.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) assert.doesNotMatch(botao[1], /<button\b/);
});

await caso('ajudas explicam queda conjunta, amostra e escapam nome externo', async () => {
  const { explicacaoSelo } = await import('../public/js/analise/panoramaMercado.js');
  assert.match(explicacaoSelo({ selo: 'JUNTO', coesao: 0.8 }), /80%/);
  assert.match(explicacaoSelo({ selo: 'JUNTO' }), /pode cair/);
  assert.match(explicacaoSelo({ selo: 'MISTO' }), /50% a menos de 70%/);
  assert.match(explicacaoSelo({ selo: 'DISPERSO' }), /menos de 50%/);
  const host = criarHostSimples();
  await cardSetoresEmpresas({ buscar: async () => ({ setores: [{ setor: '<img src=x>', empresas: 1, variacaoMediana: null }] }) }).render(host);
  assert.doesNotMatch(host.innerHTML, /<img/);
  assert.match(host.innerHTML, /Sem dado/);
});

console.log(`mercSetoresEmpresas.test.mjs ok (${casos} casos)`);
