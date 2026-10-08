// TASK-NOT-3 + TASK-NOT-4 + TASK-NOT-5: card "Notícias dos favoritos" na InicioPage.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {
  get isConnected() { return false; }
  addEventListener() {}
  querySelector() { return null; }
};
globalThis.customElements = { define() {} };

const { comunicadoDestaqueDosFavoritos } = await import('../public/js/analise/inicio.js');
const { htmlNoticiasFavoritos, htmlResumo } = await import('../public/js/pages/InicioPage.js');
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

// --- NOT-4: comunicadoDestaqueDosFavoritos ---
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

// --- NOT-3: htmlNoticiasFavoritos ---
caso('estado vazio quando sem favoritos', () => {
  const html = htmlNoticiasFavoritos(null, null, []);
  assert.match(html, /Nenhum favorito/);
});

caso('mostra alerta FATO RELEVANTE quando ha destaque (NOT-4)', () => {
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
  const html = htmlNoticiasFavoritos(manchetes, null, [{ simbolo: 'PETR4' }]);
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

caso('mostra aviso de falhas mesmo sem manchetes', () => {
  const manchetes = { manchetes: [], desatualizado: false, falhas: ['VALE3'] };
  const html = htmlNoticiasFavoritos(manchetes, null, [{ simbolo: 'VALE3' }]);
  assert.match(html, /VALE3/);
  assert.match(html, /Sem dados para/);
});

caso('manchetes null mostra mensagem de indisponivel', () => {
  const html = htmlNoticiasFavoritos(null, null, [{ simbolo: 'PETR4' }]);
  assert.match(html, /indispon/i);
});

caso('exibe botao Resumir com IA quando ha manchetes (NOT-5)', () => {
  const manchetes = {
    manchetes: [{ titulo: 'Noticia', link: 'https://a.com/1', fonte: 'X', publicadoEm: new Date().toISOString(), simbolos: ['PETR4'] }],
    desatualizado: false, falhas: [],
  };
  const html = htmlNoticiasFavoritos(manchetes, null, [{ simbolo: 'PETR4' }]);
  assert.match(html, /data-resumir-ia/);
  assert.match(html, /data-resumo-ia/);
});

caso('nao exibe botao Resumir com IA quando lista esta vazia (NOT-5)', () => {
  const manchetes = { manchetes: [], desatualizado: false, falhas: [] };
  const html = htmlNoticiasFavoritos(manchetes, null, [{ simbolo: 'PETR4' }]);
  assert.doesNotMatch(html, /data-resumir-ia/);
});

// --- NOT-5: htmlResumo ---
caso('htmlResumo: renderiza 3 topicos com links validos', () => {
  const resultado = {
    topicos: [
      { texto: 'Petroleo em alta', links: ['https://a.com/1'] },
      { texto: 'Vale reduz producao', links: ['https://b.com/2'] },
      { texto: 'Ibovespa fecha positivo', links: [] },
    ],
  };
  const manchetesOriginais = [
    { link: 'https://a.com/1' },
    { link: 'https://b.com/2' },
  ];
  const html = htmlResumo(resultado, manchetesOriginais);
  assert.match(html, /Petroleo em alta/);
  assert.match(html, /href="https:\/\/a\.com\/1"/);
  assert.match(html, /Vale reduz producao/);
  assert.match(html, /Ibovespa fecha positivo/);
});

caso('htmlResumo: descarta links fora da lista original', () => {
  const resultado = {
    topicos: [{ texto: 'Topico A', links: ['https://externo.com/nao-estava-na-lista'] }],
  };
  const manchetesOriginais = [{ link: 'https://a.com/1' }];
  const html = htmlResumo(resultado, manchetesOriginais);
  assert.match(html, /Topico A/);
  assert.doesNotMatch(html, /externo\.com/);
});

caso('htmlResumo: corta em 3 topicos', () => {
  const resultado = {
    topicos: [
      { texto: 'T1', links: [] }, { texto: 'T2', links: [] },
      { texto: 'T3', links: [] }, { texto: 'T4', links: [] },
    ],
  };
  const html = htmlResumo(resultado, []);
  assert.match(html, /T1/);
  assert.match(html, /T3/);
  assert.doesNotMatch(html, /T4/);
});

caso('htmlResumo: sem topicos retorna mensagem de indisponivel', () => {
  assert.match(htmlResumo({ topicos: [] }, []), /indispon/i);
  assert.match(htmlResumo(null, []), /indispon/i);
});

caso('htmlResumo: links de topicos diferentes nao vazam entre topicos', () => {
  const resultado = {
    topicos: [
      { texto: 'Petrobras', links: ['https://a.com/1'] },
      { texto: 'Vale', links: ['https://b.com/2'] },
    ],
  };
  const manchetesOriginais = [{ link: 'https://a.com/1' }, { link: 'https://b.com/2' }];
  const html = htmlResumo(resultado, manchetesOriginais);
  // Ambos os links devem aparecer
  assert.match(html, /a\.com\/1/);
  assert.match(html, /b\.com\/2/);
});

console.log(`manchetesFavoritos.test.mjs ok (${casos} casos)`);
