// Grafico de proventos anual/trimestral ligado a tabela (REQ-UX-11).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const {
  MODO_ANUAL, MODO_TRIMESTRAL, chaveDaLinha, indicesDosRotulos, pontosAnuais, pontosDoModo, svgProventos, tetoDoEixo,
} = await import('../public/js/analise/graficoProventos.js');
const { renderizar, htmlDica } = await import('../public/js/components/ficha/ProventosContabeis.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const periodo = (fim, tipoDoc, jcp, dividendos, extra = {}) => ({
  dtInicioExercicio: `${fim.slice(0, 7)}-01`, dtFimExercicio: fim, tipoDoc, jcp, dividendos, dataEntrega: fim, ...extra,
});

// ALOS3-like: 2023 completo (3 ITR + DFP com o 4o trimestre isolado), 2024
// sem nenhum valor, 2025 com DFP, 2026 so ITR (parcial).
const historico = [
  periodo('2023-03-31', 'ITR', 0, 10), periodo('2023-06-30', 'ITR', 0, 20),
  periodo('2023-09-30', 'ITR', 5, 0), periodo('2023-12-31', 'DFP', 0, 30),
  periodo('2024-12-31', 'DFP', null, null),
  periodo('2025-12-31', 'DFP', 0, 96_000_000),
  periodo('2026-03-31', 'ITR', 0, 146_000_000), periodo('2026-06-30', 'ITR', 0, 0),
];

caso('anual soma os trimestres isolados sem dupla contagem e marca o ano parcial', () => {
  const anos = pontosAnuais(historico);
  assert.deepEqual(anos.map((a) => a.chave), ['2023', '2024', '2025', '2026']);
  assert.equal(anos[0].jcp, 5);
  assert.equal(anos[0].dividendos, 60);
  assert.equal(anos[0].periodos, 4);
  assert.equal(anos[0].parcial, false);
  assert.equal(anos[3].parcial, true);
});

caso('ano sem nenhum valor vira lacuna, nao zero', () => {
  const anos = pontosAnuais(historico);
  assert.equal(anos[1].semDado, true);
  assert.equal(anos[1].jcp, null);
  assert.match(svgProventos(historico), /class="coluna sem-dado" data-chave="2024"/);
  assert.match(svgProventos(historico), /class="lacuna"/);
});

caso('trimestral mostra so os ultimos 12 periodos com valor', () => {
  const muitos = Array.from({ length: 60 }, (_, i) => {
    const ano = 2011 + Math.floor(i / 4);
    const mes = String(3 * ((i % 4) + 1)).padStart(2, '0');
    return periodo(`${ano}-${mes}-${mes === '03' || mes === '12' ? '31' : '30'}`, mes === '12' ? 'DFP' : 'ITR', 1, 1);
  });
  const pontos = pontosDoModo(muitos, MODO_TRIMESTRAL);
  assert.equal(pontos.length, 12);
  assert.equal(pontos[11].chave, '2025-12-31');
});

caso('eixo Y com teto redondo e grade em 0, metade e teto', () => {
  assert.equal(tetoDoEixo(146_000_000), 200_000_000);
  assert.equal(tetoDoEixo(93.2), 100);
  assert.equal(tetoDoEixo(0), 1);
  const svg = svgProventos(historico);
  assert.equal((svg.match(/class="rotulo-y"/g) || []).length, 3);
  assert.match(svg, /R\$ 200,00 mi/);
});

caso('rotulos do eixo X nao encostam e sempre incluem o ultimo', () => {
  const indices = indicesDosRotulos(60, 460);
  assert.ok(indices.length <= Math.floor(460 / 34));
  assert.equal(indices[indices.length - 1], 59);
  assert.deepEqual(indicesDosRotulos(4, 460), [0, 1, 2, 3]);
  assert.deepEqual(indicesDosRotulos(0, 460), []);
});

caso('sem rotulo de valor por coluna (o que se atropelava) e sem "R$ 0,00" no grafico', () => {
  const svg = svgProventos(historico, MODO_TRIMESTRAL);
  const textosVisiveis = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  assert.ok(textosVisiveis.every((t) => !t.includes('R$ 0,00')), textosVisiveis.join(' | '));
  assert.match(svg, /class="alvo"/);
});

caso('chaves iguais no grafico e na tabela, nos dois modos', () => {
  const html = renderizar(historico);
  for (const p of historico) {
    assert.ok(html.includes(`data-ano="${chaveDaLinha(p, MODO_ANUAL)}"`));
    assert.ok(html.includes(`data-fim="${chaveDaLinha(p, MODO_TRIMESTRAL)}"`));
  }
  for (const ponto of pontosDoModo(historico, MODO_ANUAL)) assert.ok(html.includes(`data-chave="${ponto.chave}"`));
  const trimestral = svgProventos(historico, MODO_TRIMESTRAL);
  for (const ponto of pontosDoModo(historico, MODO_TRIMESTRAL)) {
    assert.ok(historico.some((p) => chaveDaLinha(p, MODO_TRIMESTRAL) === ponto.chave));
    assert.ok(trimestral.includes(`data-chave="${ponto.chave}"`));
  }
});

caso('uma coluna so na ordem do Tab: a mais recente com dado', () => {
  const svg = svgProventos(historico);
  assert.equal((svg.match(/tabindex="0"/g) || []).length, 1);
  assert.match(svg, /data-chave="2026" tabindex="0"/);
});

caso('seletor anual/trimestral, legenda fora do SVG e dica acessivel', () => {
  const html = renderizar(historico);
  assert.match(html, /data-modo="ANUAL" aria-pressed="true"/);
  assert.match(html, /data-modo="TRIMESTRAL" aria-pressed="false"/);
  assert.match(html, /role="status" aria-live="polite" hidden/);
  assert.match(html, /legenda-proventos/);
});

caso('dica: totais do periodo, ano parcial e lacuna explicita', () => {
  const [, lacuna, , parcial] = pontosAnuais(historico);
  assert.match(htmlDica(parcial, MODO_ANUAL), /parcial/);
  assert.match(htmlDica(parcial, MODO_ANUAL), /Total R\$ 146,00 mi/);
  assert.match(htmlDica(lacuna, MODO_ANUAL), /ausente, não zero/);
  const [trimestre] = pontosDoModo(historico, MODO_TRIMESTRAL).slice(-2);
  assert.match(htmlDica(trimestre, MODO_TRIMESTRAL), /Entregue em/);
  assert.equal(htmlDica(undefined, MODO_ANUAL), '');
});

console.log(`graficoProventos: ${casos} casos ok`);
