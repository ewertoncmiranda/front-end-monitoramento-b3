// TASK-NOT-3 + TASK-NOT-4: card "Notícias dos favoritos" na InicioPage.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {
  get isConnected() { return false; }
  addEventListener() {}
  querySelector() { return null; }
};
globalThis.customElements = { define() {} };

const { comunicadoDestaqueDosFavoritos } = await import('../public/js/analise/inicio.js');
const { htmlNoticiasFavoritos } = await import('../public/js/pages/InicioPage.js');
const src = await import('node:fs').then(({ readFileSync }) =>
  readFileSync(new URL('../public/js/api/noticiasApi.js', import.meta.url), 'utf8'),
);

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

// --- noticiasApi.js ---
caso('buscarManchetesFavoritos exportada em noticiasApi.js', () => {
  assert.match(src, /export function buscarManchetesFavoritos/);
  assert.match(src, /\/noticias\/favoritos/);
});

// --- comunicadoDestaqueDosFavoritos ---
caso('retorna null sem favoritos', () => {
  const edicao = { empresas: [{ simbolo: 'PETR4', porCategoria: { FATO_RELEVANTE: 1 } }] };
  assert.equal(comunicadoDestaqueDosFavoritos(edicao, []), null);
});

caso('retorna null quando favorito nao tem FATO_RELEVANTE', () => {
  const edicao = { empresas: [{ simbolo: 'PETR4', porCategoria: { RESULTADOS: 1 } }] };
  assert.equal(comunicadoDestaqueDosFavoritos(edicao, ['PETR4']), null);
});

caso('retorna destaque quando favorito tem FATO_RELEVANTE', () => {
  const edicao = {
    semana: '2026-W41',
    empresas: [
      { simbolo: 'VALE3', porCategoria: { FATO_RELEVANTE: 0 } },
      { simbolo: 'PETR4', porCategoria: { FATO_RELEVANTE: 2 } },
    ],
  };
  const d = comunicadoDestaqueDosFavoritos(edicao, ['PETR4', 'VALE3']);
  assert.equal(d.simbolo, 'PETR4');
  assert.equal(d.total, 2);
  assert.equal(d.semana, '2026-W41');
});

caso('nao retorna empresa que nao e favorita', () => {
  const edicao = { empresas: [{ simbolo: 'ITUB4', porCategoria: { FATO_RELEVANTE: 3 } }] };
  assert.equal(comunicadoDestaqueDosFavoritos(edicao, ['PETR4']), null);
});

// --- htmlNoticiasFavoritos ---
caso('estado vazio quando sem favoritos', () => {
  const html = htmlNoticiasFavoritos(null, null, []);
  assert.match(html, /Nenhum favorito/);
});

caso('mostra alerta FATO RELEVANTE quando ha destaque', () => {
  const newsletter = { semana: '2026-W41', empresas: [{ simbolo: 'PETR4', porCategoria: { FATO_RELEVANTE: 1 } }] };
  const manchetes = { manchetes: [], desatualizado: false, falhas: [] };
  const favs = [{ simbolo: 'PETR4' }];
  const html = htmlNoticiasFavoritos(manchetes, newsletter, favs);
  assert.match(html, /FATO RELEVANTE/);
  assert.match(html, /PETR4/);
});

caso('nao mostra alerta quando favorito nao tem FATO_RELEVANTE', () => {
  const newsletter = { semana: '2026-W41', empresas: [{ simbolo: 'VALE3', porCategoria: { RESULTADOS: 1 } }] };
  const manchetes = { manchetes: [], desatualizado: false, falhas: [] };
  const favs = [{ simbolo: 'VALE3' }];
  const html = htmlNoticiasFavoritos(manchetes, newsletter, favs);
  assert.doesNotMatch(html, /FATO RELEVANTE/);
});

caso('renderiza lista de manchetes com titulo, fonte e ticker', () => {
  const manchetes = {
    manchetes: [
      { titulo: 'Petrobras sobe 3%', link: 'https://a.com/1', fonte: 'Valor', publicadoEm: new Date(Date.now() - 3600000).toISOString(), simbolos: ['PETR4'] },
    ],
    desatualizado: false,
    falhas: [],
  };
  const favs = [{ simbolo: 'PETR4' }];
  const html = htmlNoticiasFavoritos(manchetes, null, favs);
  assert.match(html, /Petrobras sobe 3%/);
  assert.match(html, /Valor/);
  assert.match(html, /PETR4/);
  assert.match(html, /href="https:\/\/a\.com\/1"/);
  assert.match(html, /target="_blank"/);
});

caso('mostra badge desatualizado quando cache vencido e ha manchetes', () => {
  const manchetes = {
    manchetes: [{ titulo: 'Noticia X', link: 'https://x.com', fonte: 'X', publicadoEm: new Date().toISOString(), simbolos: ['PETR4'] }],
    desatualizado: true,
    falhas: [],
  };
  const html = htmlNoticiasFavoritos(manchetes, null, [{ simbolo: 'PETR4' }]);
  assert.match(html, /desatualizado/);
});

caso('mostra aviso de falhas quando tickers falharam', () => {
  const manchetes = { manchetes: [], desatualizado: false, falhas: ['VALE3'] };
  const html = htmlNoticiasFavoritos(manchetes, null, [{ simbolo: 'VALE3' }]);
  assert.match(html, /VALE3/);
  assert.match(html, /Sem dados para/);
});

caso('manchetes null mostra mensagem de indisponivel', () => {
  const html = htmlNoticiasFavoritos(null, null, [{ simbolo: 'PETR4' }]);
  assert.match(html, /indispon/i);
});

console.log(`noticiasFavoritosCard.test.mjs ok (${casos} casos)`);
