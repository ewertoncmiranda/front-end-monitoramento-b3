// MERC-PAI-1: <ranking-tickers> (10+10, corte, escape, vazio, link, abas),
// buscarPanorama (URL e erro) e o card provisorio da Inicio.
import assert from 'node:assert/strict';

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

const { htmlRankingTickers, RankingTickers, LIMITE_RANKING } = await import('../public/js/components/inicio/RankingTickers.js');
const { buscarPanorama, JANELAS_PANORAMA } = await import('../public/js/api/mercadoApi.js');
const { cardPanoramaProvisorio, htmlRodapePanorama } = await import('../public/js/components/inicio/cardPanoramaProvisorio.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos += 1; }

const itens = (n, sinal = 1, prefixo = 'ATV') => Array.from({ length: n }, (_, i) => ({
  posicao: i + 1, simbolo: `${prefixo}${i + 1}`, nome: `Empresa ${i + 1}`, setor: 'Bancos', variacao: sinal * (n - i) / 100,
}));
const linhas = (html, lado) => {
  const inicio = html.indexOf(`data-coluna="${lado}"`);
  const fim = html.indexOf('</section>', inicio);
  return (html.slice(inicio, fim).match(/class="ranking-tickers__linha"/g) || []).length;
};

await caso('customElements do stub lança em duplicado', () => {
  assert.equal(customElements.get('ranking-tickers'), RankingTickers);
  assert.throws(() => customElements.define('ranking-tickers', class {}), /já foi definido/);
});

await caso('10 + 10 linhas, colunas "Maiores" e "Menores", posição e setor', () => {
  const html = htmlRankingTickers({ maiores: itens(10), menores: itens(10, -1, 'QDA') });
  assert.equal(linhas(html, 'maiores'), 10);
  assert.equal(linhas(html, 'menores'), 10);
  assert.match(html, />Maiores</);
  assert.match(html, />Menores</);
  assert.match(html, /ranking-tickers__posicao">1</);
  assert.match(html, /ranking-tickers__setor">Bancos</);
  assert.match(html, /title="Empresa 1"/);
});

await caso('corta em 10 mesmo se vierem mais', () => {
  assert.equal(LIMITE_RANKING, 10);
  const html = htmlRankingTickers({ maiores: itens(14), menores: itens(12, -1) });
  assert.equal(linhas(html, 'maiores'), 10);
  assert.equal(linhas(html, 'menores'), 10);
  assert.doesNotMatch(html, />ATV11</);
});

await caso('valor com sinal, seta e texto (nunca só cor) e barra proporcional', () => {
  const html = htmlRankingTickers({
    maiores: [{ simbolo: 'AAA3', variacao: 0.1 }, { simbolo: 'BBB3', variacao: 0.05 }],
    menores: [{ simbolo: 'CCC3', variacao: -0.02 }, { simbolo: 'DDD3', variacao: 0 }],
  });
  assert.match(html, /▲<\/span> <span class="visually-hidden">alta<\/span>\+10,00%/);
  assert.match(html, /▼<\/span> <span class="visually-hidden">queda<\/span>-2,00%/);
  assert.match(html, /visually-hidden">estável<\/span>0,00%/);
  assert.match(html, /ranking-tickers__valor--alta/);
  assert.match(html, /ranking-tickers__valor--queda/);
  assert.match(html, /width:100%/);
  assert.match(html, /width:50%/);
  // Formatador e valor por propriedade; nao direcional (ex.: volume) nao leva seta.
  const neutro = htmlRankingTickers({ maiores: [{ simbolo: 'X', volume: 2e9 }, { simbolo: 'Y', volume: 1e9 }], menores: [] },
    { valor: (i) => i.volume, formatar: (i) => `R$ ${i.volume / 1e9} bi`, direcional: false });
  assert.match(neutro, /R\$ 2 bi/);
  assert.doesNotMatch(neutro, /▲|▼/);
  assert.match(neutro, /width:50%/);
  // Escala comum: a menor lista mede contra o maior modulo das duas.
  const comum = htmlRankingTickers({ maiores: [{ simbolo: 'A', variacao: 0.2 }], menores: [{ simbolo: 'B', variacao: -0.05 }] }, { escalaComum: true });
  assert.match(comum, /width:25%/);
});

await caso('ticker clicável para a ficha #/ativo/XXXX', () => {
  const html = htmlRankingTickers({ maiores: [{ simbolo: 'PETR4', variacao: 0.01 }], menores: [] });
  assert.match(html, /<a class="ranking-tickers__ticker" href="#\/ativo\/PETR4">PETR4<\/a>/);
});

await caso('escapa todo texto externo', () => {
  const html = htmlRankingTickers({
    maiores: [{ simbolo: '<script>x</script>', nome: '"><img>', setor: '<b>Setor</b>', variacao: 0.01, posicao: '<i>' }],
    menores: [],
  }, { rotulos: { maiores: '<u>Altas</u>' }, formatar: () => '<svg>' });
  assert.doesNotMatch(html, /<script>|<img>|<b>|<u>|<svg>|<i>/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  assert.match(html, /href="#\/ativo\/%3Cscript%3Ex%3C%2Fscript%3E"/);
});

await caso('estado vazio: listas vazias, ausentes ou só um lado', () => {
  for (const dados of [null, {}, { maiores: [], menores: [] }]) {
    const html = htmlRankingTickers(dados);
    assert.match(html, /estado-vazio/);
    assert.match(html, /Ranking sem dados/);
  }
  assert.match(htmlRankingTickers({}, { vazio: { titulo: 'Liquidez ainda não calculada' } }), /Liquidez ainda não calculada/);
  const meio = htmlRankingTickers({ maiores: itens(3), menores: [] });
  assert.equal(linhas(meio, 'maiores'), 3);
  assert.match(meio, /Sem ativos nesta lista/);
});

await caso('abas para o celular: tablist, aria-selected e troca por clique/teclado', () => {
  const html = htmlRankingTickers({ maiores: itens(2), menores: itens(2, -1) }, {}, { idBase: 'r1', ativa: 'menores' });
  assert.match(html, /role="tablist"/);
  assert.match(html, /data-aba="maiores"[\s\S]*?aria-selected="false"/);
  assert.match(html, /data-aba="menores"[\s\S]*?aria-selected="true"/);
  assert.match(html, /class="ranking-tickers__coluna is-ativa" id="r1-menores"/);

  const el = new RankingTickers();
  const abas = ['maiores', 'menores'].map((lado) => ({
    dataset: { aba: lado }, attrs: {}, tabIndex: 0, focado: false,
    setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focado = true; },
  }));
  const colunas = ['maiores', 'menores'].map((lado) => ({
    dataset: { coluna: lado }, ativa: false, classList: { toggle(_, v) { colunas.find((c) => c.dataset.coluna === lado).ativa = v; } },
  }));
  el.querySelectorAll = (sel) => (sel === '[data-aba]' ? abas : sel === '[data-coluna]' ? colunas : []);
  el.dados = { maiores: itens(2), menores: itens(2, -1) };
  assert.match(el.innerHTML, /ranking-tickers__linha/);
  el.disparar('click', { target: { closest: () => abas[1] } });
  assert.equal(abas[1].attrs['aria-selected'], 'true');
  assert.equal(abas[0].attrs['aria-selected'], 'false');
  assert.equal(colunas[1].ativa, true);
  assert.equal(colunas[0].ativa, false);
  let parou = false;
  el.disparar('keydown', { key: 'ArrowRight', target: { closest: () => abas[1] }, preventDefault() {}, stopPropagation() { parou = true; } });
  assert.equal(abas[0].attrs['aria-selected'], 'true');
  assert.equal(abas[0].focado, true);
  assert.ok(parou, 'seta nas abas não chega ao carrossel');
  // Redesenho preserva a aba escolhida e nao duplica listeners.
  el.dados = { maiores: itens(1), menores: itens(1, -1) };
  assert.match(el.innerHTML, /id="ranking-\d+-maiores"/);
  assert.equal(el._ouvintes.filter((o) => o.tipo === 'click').length, 1);
});

const fetchOriginal = globalThis.fetch;
const resposta = (status, corpo) => ({ ok: status >= 200 && status < 300, status, text: async () => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)) });

await caso('buscarPanorama: URL com janela, padrão 5d', async () => {
  const urls = [];
  globalThis.fetch = async (url, opcoes) => { urls.push({ url, opcoes }); return resposta(200, { janela: '5d' }); };
  try {
    assert.deepEqual(await buscarPanorama(), { janela: '5d' });
    await buscarPanorama('21d');
    await buscarPanorama('ano');
    assert.deepEqual(urls.map((u) => u.url), ['/mercado/panorama?janela=5d', '/mercado/panorama?janela=21d', '/mercado/panorama?janela=ano']);
    assert.equal(urls[0].opcoes.headers.Accept, 'application/json');
    assert.deepEqual(JANELAS_PANORAMA, ['1d', '5d', '21d', 'ano']);
  } finally { globalThis.fetch = fetchOriginal; }
});

await caso('buscarPanorama: erro com status, data e mensagem de `erro`', async () => {
  globalThis.fetch = async () => resposta(400, { erro: 'janela inválida: 2d' });
  try {
    await assert.rejects(buscarPanorama('2d'), (e) => e.status === 400 && e.message === 'janela inválida: 2d' && e.data.erro === 'janela inválida: 2d');
    globalThis.fetch = async () => resposta(404, '');
    await assert.rejects(buscarPanorama(), (e) => e.status === 404 && /panorama do mercado \(404\)/.test(e.message));
    globalThis.fetch = async () => resposta(500, { mensagem: 'm', erro: 'e' });
    await assert.rejects(buscarPanorama(), /^Error: m$/);
  } finally { globalThis.fetch = fetchOriginal; }
});

await caso('card provisório: altas/quedas no ranking e rodapé com pregão e universo', async () => {
  let ranking;
  const host = {
    innerHTML: '',
    querySelector(sel) { if (sel === 'ranking-tickers') { ranking = new RankingTickers(); return ranking; } return null; },
  };
  const panorama = { janela: '5d', dataPregao: '2026-10-19', universo: { liquidos: 196 }, altas: itens(12), quedas: itens(10, -1), indisponivel: [] };
  const card = cardPanoramaProvisorio({ buscar: async (janela) => { assert.equal(janela, '5d'); return panorama; } });
  assert.equal(card.tituloErro, 'Panorama indisponível');
  await card.render(host);
  assert.match(host.innerHTML, /<ranking-tickers><\/ranking-tickers>/);
  assert.match(host.innerHTML, /196 ações líquidas · pregão de 19-10-2026 · período: 5 dias/);
  assert.equal(linhas(ranking.innerHTML, 'maiores'), 10);
  assert.equal(linhas(ranking.innerHTML, 'menores'), 10);
  assert.match(ranking.innerHTML, />Maiores altas</);

  const vazio = { innerHTML: '', querySelector: () => null };
  await cardPanoramaProvisorio({ buscar: async () => ({ ...panorama, altas: [], quedas: [], indisponivel: ['altas', 'quedas'] }) }).render(vazio);
  assert.match(vazio.innerHTML, /ainda sem dado/);
  await assert.rejects(cardPanoramaProvisorio({ buscar: async () => { throw new Error('404'); } }).render(vazio), /404/);
  assert.equal(htmlRodapePanorama({}), '');
  assert.doesNotMatch(htmlRodapePanorama({ universo: { liquidos: '<b>' } }), /<b>/);
});

console.log(`mercRanking.test.mjs ok (${casos} casos)`);
