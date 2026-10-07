// Unica responsabilidade: SVG de colunas empilhadas (JCP + dividendos) dos
// proventos contabeis por periodo (REQ-UX-4). Puro: devolve string SVG, sem DOM.
import { escaparHtml } from '../utils/html.js';
import { formatarMoedaCompacta } from './lacunas.js';

const L = 520;
const A = 190;
const MARGEM = { topo: 14, base: 34, esq: 8, dir: 8 };

const numeroOuNulo = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** Um ponto por periodo, do mais antigo ao mais novo; periodo sem JCP e sem dividendo e descartado (ausente nao e zero). */
export function pontosDoGrafico(proventos) {
  return (proventos || [])
    .map((p) => ({
      rotulo: rotuloDoPeriodo(p),
      jcp: numeroOuNulo(p.jcp),
      dividendos: numeroOuNulo(p.dividendos),
      chave: String(p.dtFimExercicio || ''),
    }))
    .filter((p) => p.jcp !== null || p.dividendos !== null)
    .sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0));
}

function rotuloDoPeriodo(p) {
  const fim = String(p.dtFimExercicio || '');
  const ano = fim.slice(0, 4);
  const mes = fim.slice(5, 7);
  if (!ano) return '?';
  return p.tipoDoc === 'DFP' || mes === '12' ? ano : `${mes}/${ano.slice(2)}`;
}

export function svgProventos(proventos) {
  const pontos = pontosDoGrafico(proventos);
  if (!pontos.length) return '';
  const total = (p) => (p.jcp || 0) + (p.dividendos || 0);
  const maximo = Math.max(...pontos.map(total), 1);
  const larg = (L - MARGEM.esq - MARGEM.dir) / pontos.length;
  const barra = Math.min(46, larg * 0.62);
  const base = A - MARGEM.base;
  const h = (v) => ((v || 0) / maximo) * (base - MARGEM.topo);
  const colunas = pontos.map((p, i) => {
    const x = MARGEM.esq + i * larg + (larg - barra) / 2;
    const hj = h(p.jcp);
    const hd = h(p.dividendos);
    const descricao = `${p.rotulo}: JCP ${formatarMoedaCompacta(p.jcp)}, dividendos ${formatarMoedaCompacta(p.dividendos)}`;
    return `<g><title>${escaparHtml(descricao)}</title>
      <rect class="dividendos" x="${x.toFixed(1)}" y="${(base - hd).toFixed(1)}" width="${barra.toFixed(1)}" height="${hd.toFixed(1)}"/>
      <rect class="jcp" x="${x.toFixed(1)}" y="${(base - hd - hj).toFixed(1)}" width="${barra.toFixed(1)}" height="${hj.toFixed(1)}"/>
      <text x="${(x + barra / 2).toFixed(1)}" y="${A - 18}" text-anchor="middle">${escaparHtml(p.rotulo)}</text>
      <text x="${(x + barra / 2).toFixed(1)}" y="${(base - hd - hj - 3).toFixed(1)}" text-anchor="middle">${escaparHtml(formatarMoedaCompacta(total(p)))}</text></g>`;
  }).join('');
  return `<svg class="grafico-proventos" viewBox="0 0 ${L} ${A}" role="img" aria-label="Proventos por período: JCP e dividendos">
    <line class="eixo" x1="${MARGEM.esq}" y1="${base}" x2="${L - MARGEM.dir}" y2="${base}"/>${colunas}
    <rect class="jcp" x="${MARGEM.esq}" y="${A - 10}" width="8" height="8"/><text x="${MARGEM.esq + 12}" y="${A - 3}">JCP</text>
    <rect class="dividendos" x="${MARGEM.esq + 50}" y="${A - 10}" width="8" height="8"/><text x="${MARGEM.esq + 62}" y="${A - 3}">Dividendos</text></svg>`;
}
