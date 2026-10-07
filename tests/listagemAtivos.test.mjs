// Tabela unica de ativos (REQ-UX-8 / TASK-UX-6): renderizacao pura de
// public/js/analise/listagemAtivos.js sobre o contrato de GET /painel/ativos.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { htmlTabelaAtivos, htmlSparkline, htmlSinal, filtrosDaVisao } = await import('../public/js/analise/listagemAtivos.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const linha = (extra = {}) => ({
  simbolo: 'PETR4', nome: 'PETROBRAS', setor: 'Petróleo e Gás',
  ultimoFechamento: 53.82, dataUltimoFechamento: '2026-10-06', variacaoPercentual: -2.78,
  serieFechamentos: [55.36, 53.82],
  sinal: { recomendacao: 'VENDA_VALUATION', versaoRegra: '2026.09.27-3', dataAnalise: '2026-10-07T07:01:00' },
  ultimoComunicado: { categoria: 'FATO_RELEVANTE', assunto: 'Descoberta', dataEntrega: '2026-10-01', link: 'https://www.rad.cvm.gov.br/x' },
  selos: { favorito: false, monitorado: true, temFundamento: true, pregaoDefasado: false },
  ...extra,
});

caso('linha completa: preco, variacao com sinal, sparkline, sinal, comunicado e acao', () => {
  const html = htmlTabelaAtivos([linha()]);
  assert.match(html, /href="#\/gestao\/PETR4"/);
  assert.match(html, /R\$ 53,82/);
  assert.match(html, /-2,78%/);
  assert.match(html, /text-danger/);
  assert.match(html, /<svg class="ativo-sparkline desce"/);
  assert.match(html, /Venda por valuation/, 'mesmo rotulo da ficha, nao "Venda"');
  assert.match(html, /Regra experimental 2026\.09\.27-3/);
  assert.match(html, /Descoberta/);
  assert.match(html, /06-10-2026/);
  assert.match(html, /Monitorado/);
  assert.match(html, /data-favoritar="PETR4"/);
});

caso('ausente vira traco ou "sem", nunca zero', () => {
  const html = htmlTabelaAtivos([linha({ ultimoFechamento: null, dataUltimoFechamento: null, variacaoPercentual: null, serieFechamentos: [], sinal: null, ultimoComunicado: null, selos: { temFundamento: false, pregaoDefasado: true } })]);
  assert.match(html, /sem pregão/);
  assert.match(html, /Sem sinal/);
  assert.match(html, /Sem balanço/);
  assert.match(html, /Preço antigo/);
  assert.ok(!/R\$ 0,00/.test(html));
  assert.ok(!/0,00%/.test(html));
});

caso('favorito: selo nas visoes gerais, "Remover" so na visao de favoritos', () => {
  const fav = linha({ selos: { favorito: true, monitorado: true, temFundamento: true } });
  const geral = htmlTabelaAtivos([fav], { visao: 'todos' });
  assert.match(geral, /Favorito/);
  assert.ok(!geral.includes('data-remover-favorito'));
  assert.ok(!geral.includes('data-favoritar'));
  assert.ok(!geral.includes('>Monitorado<'), 'favorito ja implica monitorado');
  assert.match(htmlTabelaAtivos([fav], { visao: 'favoritos' }), /data-remover-favorito="PETR4"/);
});

caso('texto da API e escapado', () => {
  const html = htmlTabelaAtivos([linha({ nome: '<img src=x onerror=alert(1)>', ultimoComunicado: { assunto: '<script>x</script>', dataEntrega: '2026-10-01' } })]);
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script>'));
});

caso('vazio explica a causa conforme a visao', () => {
  assert.match(htmlTabelaAtivos([], { visao: 'favoritos' }), /Nenhum favorito/);
  assert.match(htmlTabelaAtivos([]), /Limpe a busca/);
});

caso('sparkline: menos de 2 pontos nao desenha; serie constante fica no meio', () => {
  assert.ok(!htmlSparkline([10]).includes('<svg'));
  assert.ok(!htmlSparkline(null).includes('<svg'));
  assert.match(htmlSparkline([10, 10, 10]), /points="0\.0,14\.0 48\.0,14\.0 96\.0,14\.0"/);
  assert.match(htmlSparkline([1, 2]), /sobe/);
});

caso('sinal sem recomendacao vira "Sem sinal"; recomendacao desconhecida aparece crua', () => {
  assert.match(htmlSinal({}), /Sem sinal/);
  assert.match(htmlSinal({ recomendacao: 'SEM_MARGEM' }), /Sem margem/);
  assert.doesNotMatch(htmlSinal({ recomendacao: 'SEM_MARGEM' }), /Venda/);
  assert.match(htmlSinal({ recomendacao: 'NOVA_REGRA' }), /NOVA_REGRA/);
});

caso('filtros de cada visao', () => {
  assert.deepEqual(filtrosDaVisao('favoritos'), { favoritos: true });
  assert.deepEqual(filtrosDaVisao('monitorados'), { monitorados: true });
  assert.deepEqual(filtrosDaVisao('todos'), {});
});

console.log(`listagemAtivos.test.mjs ok (${casos} casos)`);
