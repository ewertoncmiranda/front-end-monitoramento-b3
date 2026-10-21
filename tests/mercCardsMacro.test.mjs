// MERC-PAI-4: CardVolumeAnormal, CardMacro e CardEventos - renderização,
// estado vazio por bloco em `indisponivel`, isolamento de erro e formatação
// dos valores macro.
import assert from 'node:assert/strict';

// --- stubs globais (mesmo padrao de mercCarrossel.test.mjs) ----------------
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

// Importa os tres cards e as funcoes de formatacao
const { cardVolumeAnormal } = await import('../public/js/components/inicio/cards/CardVolumeAnormal.js');
const { cardMacro, formatarTaxaAa, formatarVariacaoPeriodo, formatarDolar } = await import('../public/js/components/inicio/cards/CardMacro.js');
const { cardEventos } = await import('../public/js/components/inicio/cards/CardEventos.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos += 1; }

// Helpers
function hostFalso() {
  const h = {
    innerHTML: '',
    _ranking: null,
    querySelector(sel) {
      if (sel === 'ranking-tickers') {
        h._ranking = { _dados: null, _opcoes: {}, set dados(v) { this._dados = v; }, set rotulos(v) { this._opcoes.rotulos = v; }, set direcional(v) { this._opcoes.direcional = v; }, set valor(v) { this._opcoes.valor = v; }, set formatar(v) { this._opcoes.formatar = v; } };
        return h._ranking;
      }
      return null;
    },
  };
  return h;
}

const panoramaBase = {
  janela: '5d',
  dataPregao: '2026-10-20',
  universo: { liquidos: 200 },
  indisponivel: [],
  volumeAnormal: [
    { posicao: 1, simbolo: 'PETR4', razao: 4.2 },
    { posicao: 2, simbolo: 'VALE3', razao: 2.8 },
  ],
  macro: {
    selic: 0.15,
    cdiPeriodo: 0.0028,
    dolar: 5.42,
    ipca12m: 0.047,
  },
  eventos: [
    { simbolo: 'BBAS3', tipo: 'DESDOBRAMENTO', data: '2026-10-10', fator: '1:2' },
    { simbolo: 'ITUB4', tipo: 'GRUPAMENTO', data: '2026-10-12', fator: '2:1' },
    { simbolo: 'ABEV3', tipo: 'BONIFICACAO', data: '2026-10-15', fator: '10%' },
  ],
};

// ============================================================
// stub de customElements lanca em nome duplicado
// ============================================================
await caso('stub de customElements lança em nome duplicado, como o navegador', () => {
  assert.ok(customElements.get('ranking-tickers'));
  assert.throws(() => customElements.define('ranking-tickers', class {}), /já foi definido/);
});

// ============================================================
// CardVolumeAnormal
// ============================================================
await caso('CardVolumeAnormal: renderiza com dados do panorama', async () => {
  const host = hostFalso();
  const card = cardVolumeAnormal({ buscar: async () => panoramaBase });
  assert.equal(card.id, 'volume-anormal');
  assert.equal(card.titulo, 'Volume fora do normal');
  await card.render(host);
  assert.match(host.innerHTML, /<ranking-tickers>/);
  assert.ok(host._ranking, 'ranking-tickers foi configurado');
  assert.deepEqual(host._ranking._dados?.maiores, panoramaBase.volumeAnormal);
  assert.deepEqual(host._ranking._dados?.menores, []);
  assert.match(host.innerHTML, /rodap|ações líquidas|pregão/i);
});

await caso('CardVolumeAnormal: estado vazio quando bloco em indisponivel', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, indisponivel: ['volumeAnormal'] };
  await cardVolumeAnormal({ buscar: async () => panorama }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.match(host.innerHTML, /ainda sem dado/);
});

await caso('CardVolumeAnormal: estado vazio quando lista vazia', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, volumeAnormal: [] };
  await cardVolumeAnormal({ buscar: async () => panorama }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
});

await caso('CardVolumeAnormal: erro na busca propaga (isolado pelo carrossel)', async () => {
  const card = cardVolumeAnormal({ buscar: async () => { throw new Error('HTTP 503'); } });
  await assert.rejects(() => card.render(hostFalso()), /HTTP 503/);
});

await caso('CardVolumeAnormal: formatar exibe razao com uma casa decimal e ×', async () => {
  const host = hostFalso();
  await cardVolumeAnormal({ buscar: async () => panoramaBase }).render(host);
  const item = panoramaBase.volumeAnormal[0];
  const texto = host._ranking._opcoes.formatar(item);
  assert.equal(texto, '4,2× a média');
});

// ============================================================
// CardMacro
// ============================================================
await caso('CardMacro: renderiza grade de 4 itens com valores formatados', async () => {
  const host = hostFalso();
  const card = cardMacro({ buscar: async () => panoramaBase });
  assert.equal(card.id, 'macro');
  assert.equal(card.titulo, 'Indicadores macro');
  await card.render(host);
  assert.match(host.innerHTML, /card-macro__grade/);
  assert.match(host.innerHTML, /15,00% a\.a\./);
  assert.match(host.innerHTML, /\+0,28% no período/);
  assert.match(host.innerHTML, /R\$ 5,42/);
  assert.match(host.innerHTML, /4,70% a\.a\./);
  assert.match(host.innerHTML, /Selic e IPCA são pontuais/);
});

await caso('CardMacro: estado vazio quando bloco em indisponivel', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, indisponivel: ['macro'] };
  await cardMacro({ buscar: async () => panorama }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
  assert.match(host.innerHTML, /ainda sem dado/);
});

await caso('CardMacro: valores null exibem —', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, macro: { selic: null, cdiPeriodo: null, dolar: null, ipca12m: null } };
  await cardMacro({ buscar: async () => panorama }).render(host);
  const matches = host.innerHTML.match(/—/g) || [];
  assert.ok(matches.length >= 4, `esperava pelo menos 4 traços, encontrou ${matches.length}`);
});

await caso('CardMacro: erro na busca propaga', async () => {
  const card = cardMacro({ buscar: async () => { throw new Error('timeout'); } });
  await assert.rejects(() => card.render(hostFalso()), /timeout/);
});

// ============================================================
// Formatacao (testes unitarios das funcoes exportadas)
// ============================================================
await caso('formatarTaxaAa: selic 0.15 → "15,00% a.a."', () => {
  assert.equal(formatarTaxaAa(0.15), '15,00% a.a.');
});

await caso('formatarTaxaAa: ipca12m 0.047 → "4,70% a.a."', () => {
  assert.equal(formatarTaxaAa(0.047), '4,70% a.a.');
});

await caso('formatarVariacaoPeriodo: cdiPeriodo 0.0028 → "+0,28% no período"', () => {
  assert.equal(formatarVariacaoPeriodo(0.0028), '+0,28% no período');
});

await caso('formatarVariacaoPeriodo: valor negativo leva sinal negativo', () => {
  assert.match(formatarVariacaoPeriodo(-0.001), /^-/);
});

await caso('formatarDolar: 5.42 → "R$ 5,42"', () => {
  assert.equal(formatarDolar(5.42), 'R$ 5,42');
});

await caso('formatarTaxaAa/Dolar/Variacao: null → "—"', () => {
  assert.equal(formatarTaxaAa(null), '—');
  assert.equal(formatarDolar(null), '—');
  assert.equal(formatarVariacaoPeriodo(null), '—');
  assert.equal(formatarTaxaAa(undefined), '—');
});

// ============================================================
// CardEventos
// ============================================================
await caso('CardEventos: renderiza lista de eventos com simbolo, tipo legivel e data', async () => {
  const host = hostFalso();
  const card = cardEventos({ buscar: async () => panoramaBase });
  assert.equal(card.id, 'eventos-recentes');
  assert.equal(card.titulo, 'Eventos recentes');
  await card.render(host);
  assert.match(host.innerHTML, /card-eventos__lista/);
  assert.match(host.innerHTML, /BBAS3/);
  assert.match(host.innerHTML, /Desdobramento/);
  assert.match(host.innerHTML, /Grupamento/);
  assert.match(host.innerHTML, /Bonifica/);
  assert.match(host.innerHTML, /10-10-2026/);
  assert.match(host.innerHTML, /#\/ativo\/BBAS3/);
});

await caso('CardEventos: corta em 10 mesmo se vierem mais', async () => {
  const muitosEventos = Array.from({ length: 15 }, (_, i) => ({
    simbolo: `ATV${i + 1}`, tipo: 'DESDOBRAMENTO', data: '2026-10-01', fator: '1:2',
  }));
  const host = hostFalso();
  await cardEventos({ buscar: async () => ({ ...panoramaBase, eventos: muitosEventos }) }).render(host);
  const matches = host.innerHTML.match(/card-eventos__linha/g) || [];
  assert.equal(matches.length, 10);
});

await caso('CardEventos: estado vazio quando bloco em indisponivel', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, indisponivel: ['eventos'] };
  await cardEventos({ buscar: async () => panorama }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
});

await caso('CardEventos: estado vazio quando lista vazia', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, eventos: [] };
  await cardEventos({ buscar: async () => panorama }).render(host);
  assert.match(host.innerHTML, /estado-vazio/);
});

await caso('CardEventos: erro na busca propaga', async () => {
  const card = cardEventos({ buscar: async () => { throw new Error('HTTP 404'); } });
  await assert.rejects(() => card.render(hostFalso()), /HTTP 404/);
});

await caso('CardEventos: tipo desconhecido exibe como veio', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, eventos: [{ simbolo: 'XPTO3', tipo: 'CISAO', data: '2026-10-01', fator: null }] };
  await cardEventos({ buscar: async () => panorama }).render(host);
  assert.match(host.innerHTML, /CISAO/);
});

await caso('CardEventos: escapa texto externo (simbolo com caracteres especiais)', async () => {
  const host = hostFalso();
  const panorama = { ...panoramaBase, eventos: [{ simbolo: '<script>', tipo: 'DESDOBRAMENTO', data: '2026-10-01', fator: null }] };
  await cardEventos({ buscar: async () => panorama }).render(host);
  assert.doesNotMatch(host.innerHTML, /<script>/);
  assert.match(host.innerHTML, /&lt;script&gt;/);
});

// ============================================================
// InicioPage: carrossel com 4 cards (provisorio + 3 novos)
// ============================================================
await caso('InicioPage: array do carrossel tem cardPanoramaProvisorio e os 3 novos cards', async () => {
  const { readFileSync } = await import('node:fs');
  const fonte = readFileSync(new URL('../public/js/pages/InicioPage.js', import.meta.url), 'utf8');
  assert.match(fonte, /cardPanoramaProvisorio\(\)/);
  assert.match(fonte, /cardVolumeAnormal\(\)/);
  assert.match(fonte, /cardMacro\(\)/);
  assert.match(fonte, /cardEventos\(\)/);
  // Garante a ordem: provisorio primeiro
  const idxProvisorio = fonte.indexOf('cardPanoramaProvisorio()');
  const idxVolume = fonte.indexOf('cardVolumeAnormal()');
  const idxMacro = fonte.indexOf('cardMacro()');
  const idxEventos = fonte.indexOf('cardEventos()');
  assert.ok(idxProvisorio < idxVolume, 'provisório antes do volume');
  assert.ok(idxVolume < idxMacro, 'volume antes do macro');
  assert.ok(idxMacro < idxEventos, 'macro antes do eventos');
});

console.log(`mercCardsMacro.test.mjs ok (${casos} casos)`);
