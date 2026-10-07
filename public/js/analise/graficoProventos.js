// Unica responsabilidade: SVG de colunas empilhadas (JCP + dividendos) dos
// proventos contabeis (REQ-UX-4, REQ-UX-11). Puro: devolve dados e string SVG,
// sem DOM - a interacao (destaque com a tabela) fica no componente.
//
// Dois modos: ANUAL (padrao, um exercicio por coluna - "quanto pagou por ano")
// e TRIMESTRAL (so os ultimos 12 periodos). Com o historico desde 2010 sao ~60
// periodos: um por coluna em 520 px nao cabe nem rotulo nem leitura.
import { escaparHtml } from '../utils/html.js';
import { formatarMoedaCompacta } from './lacunas.js';

export const MODO_ANUAL = 'ANUAL';
export const MODO_TRIMESTRAL = 'TRIMESTRAL';
export const MAXIMO_TRIMESTRES = 12;

const L = 520;
const A = 190;
const MARGEM = { topo: 10, base: 22, esq: 52, dir: 8 };
// Largura minima por rotulo do eixo X: abaixo disso os textos se encostam.
const LARGURA_ROTULO = 34;

const numeroOuNulo = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const somaOuNulo = (a, b) => (a === null && b === null ? null : (a || 0) + (b || 0));

/** Um ponto por periodo, do mais antigo ao mais novo; periodo sem JCP e sem dividendo e descartado (ausente nao e zero). */
export function pontosDoGrafico(proventos) {
  return (proventos || [])
    .map((p) => ({
      rotulo: rotuloDoPeriodo(p),
      jcp: numeroOuNulo(p.jcp),
      dividendos: numeroOuNulo(p.dividendos),
      chave: String(p.dtFimExercicio || ''),
      porAcao: numeroOuNulo(p.porAcao),
      periodo: { inicio: p.dtInicioExercicio, fim: p.dtFimExercicio, tipoDoc: p.tipoDoc, entrega: p.dataEntrega },
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

/**
 * Um ponto por ano civil do fim do periodo, somando os trimestres (os
 * periodos ja vem isolados: o 4o trimestre e DFP menos o 3o ITR, sem dupla
 * contagem). Ano entre o primeiro e o ultimo sem nenhum valor vira `semDado`
 * (lacuna, nao zero). Ano sem DFP e `parcial` (o corrente, em geral).
 */
export function pontosAnuais(proventos) {
  const porAno = new Map();
  for (const p of pontosDoGrafico(proventos)) {
    const ano = p.chave.slice(0, 4);
    const atual = porAno.get(ano) || { chave: ano, rotulo: ano, jcp: null, dividendos: null, periodos: 0, temDfp: false, ultimoFim: '' };
    atual.jcp = somaOuNulo(atual.jcp, p.jcp);
    atual.dividendos = somaOuNulo(atual.dividendos, p.dividendos);
    atual.periodos += 1;
    atual.temDfp = atual.temDfp || p.periodo.tipoDoc === 'DFP';
    atual.ultimoFim = p.chave > atual.ultimoFim ? p.chave : atual.ultimoFim;
    porAno.set(ano, atual);
  }
  const anos = [...porAno.keys()].sort();
  if (!anos.length) return [];
  const saida = [];
  for (let ano = Number(anos[0]); ano <= Number(anos[anos.length - 1]); ano += 1) {
    const ponto = porAno.get(String(ano));
    saida.push(ponto
      ? { ...ponto, parcial: !ponto.temDfp }
      : { chave: String(ano), rotulo: String(ano), jcp: null, dividendos: null, periodos: 0, semDado: true });
  }
  return saida;
}

/** Os pontos do modo pedido: anual inteiro, ou os ultimos 12 trimestres. */
export function pontosDoModo(proventos, modo = MODO_ANUAL) {
  if (modo === MODO_TRIMESTRAL) return pontosDoGrafico(proventos).slice(-MAXIMO_TRIMESTRES);
  return pontosAnuais(proventos);
}

/** Chave da linha da tabela no modo: o ano (anual) ou o fim do periodo (trimestral). */
export function chaveDaLinha(provento, modo = MODO_ANUAL) {
  const fim = String(provento.dtFimExercicio || '');
  return modo === MODO_TRIMESTRAL ? fim : fim.slice(0, 4);
}

/** Teto "redondo" do eixo Y (1, 2, 2,5 ou 5 x 10^k), para a grade cair em valores legiveis. */
export function tetoDoEixo(maximo) {
  if (!(maximo > 0)) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const passo = [1, 2, 2.5, 5, 10].find((m) => m * potencia >= maximo);
  return passo * potencia;
}

/** Indices dos rotulos do eixo X: um a cada N colunas, sempre o ultimo, sem encostar. */
export function indicesDosRotulos(quantidade, larguraUtil = L - MARGEM.esq - MARGEM.dir) {
  if (quantidade <= 0) return [];
  const cabem = Math.max(1, Math.floor(larguraUtil / LARGURA_ROTULO));
  const passo = Math.ceil(quantidade / cabem);
  const indices = [];
  for (let i = quantidade - 1; i >= 0; i -= passo) indices.unshift(i);
  return indices;
}

export function totalDoPonto(p) {
  return somaOuNulo(p.jcp, p.dividendos);
}

export function svgProventos(proventos, modo = MODO_ANUAL) {
  const pontos = pontosDoModo(proventos, modo);
  if (!pontos.some((p) => !p.semDado)) return '';
  const teto = tetoDoEixo(Math.max(...pontos.map((p) => totalDoPonto(p) || 0)));
  const largUtil = L - MARGEM.esq - MARGEM.dir;
  const larg = largUtil / pontos.length;
  const barra = Math.max(2, Math.min(40, larg * 0.66));
  const base = A - MARGEM.base;
  const alturaUtil = base - MARGEM.topo;
  const h = (v) => ((v || 0) / teto) * alturaUtil;

  const grade = [0, 0.5, 1].map((f) => {
    const y = (base - f * alturaUtil).toFixed(1);
    return `<line class="${f === 0 ? 'eixo' : 'grade'}" x1="${MARGEM.esq}" y1="${y}" x2="${L - MARGEM.dir}" y2="${y}"/>
      <text class="rotulo-y" x="${MARGEM.esq - 4}" y="${(Number(y) + 3).toFixed(1)}" text-anchor="end">${f === 0 ? '0' : escaparHtml(formatarMoedaCompacta(teto * f))}</text>`;
  }).join('');

  const rotulados = new Set(indicesDosRotulos(pontos.length, largUtil));
  // Uma coluna so entra na ordem do Tab (a mais recente com dado); as setas
  // andam entre as outras (roving tabindex).
  const focavel = pontos.map((p) => !p.semDado).lastIndexOf(true);
  const colunas = pontos.map((p, i) => {
    const x0 = MARGEM.esq + i * larg;
    const x = x0 + (larg - barra) / 2;
    const meio = (x + barra / 2).toFixed(1);
    const rotulo = rotulados.has(i)
      ? `<text class="rotulo-x" x="${meio}" y="${A - 8}" text-anchor="middle">${escaparHtml(p.rotulo)}${p.parcial ? '*' : ''}</text>`
      : '';
    // Alvo invisivel da altura toda: o mouse nao precisa acertar a barra fina.
    const alvo = `<rect class="alvo" x="${x0.toFixed(1)}" y="${MARGEM.topo}" width="${larg.toFixed(1)}" height="${alturaUtil.toFixed(1)}"/>`;
    if (p.semDado) {
      return `<g class="coluna sem-dado" data-chave="${escaparHtml(p.chave)}" tabindex="-1" aria-label="${escaparHtml(`${p.rotulo}: sem dado`)}">${alvo}
        <rect class="lacuna" x="${x.toFixed(1)}" y="${(base - 6).toFixed(1)}" width="${barra.toFixed(1)}" height="6"/>${rotulo}</g>`;
    }
    const hd = h(p.dividendos);
    const hj = h(p.jcp);
    const descricao = `${p.rotulo}${p.parcial ? ' (parcial)' : ''}: JCP ${formatarMoedaCompacta(p.jcp)}, dividendos ${formatarMoedaCompacta(p.dividendos)}, total ${formatarMoedaCompacta(totalDoPonto(p))}`;
    return `<g class="coluna" data-chave="${escaparHtml(p.chave)}" tabindex="${i === focavel ? 0 : -1}" role="listitem" aria-label="${escaparHtml(descricao)}">${alvo}
      <line class="guia" x1="${meio}" y1="${MARGEM.topo}" x2="${meio}" y2="${base}"/>
      <rect class="dividendos" x="${x.toFixed(1)}" y="${(base - hd).toFixed(1)}" width="${barra.toFixed(1)}" height="${hd.toFixed(1)}"/>
      <rect class="jcp" x="${x.toFixed(1)}" y="${(base - hd - hj).toFixed(1)}" width="${barra.toFixed(1)}" height="${hj.toFixed(1)}"/>${rotulo}</g>`;
  }).join('');

  const titulo = modo === MODO_TRIMESTRAL ? 'Proventos dos últimos trimestres' : 'Proventos por ano';
  return `<svg class="grafico-proventos" viewBox="0 0 ${L} ${A}" role="list" aria-label="${titulo}: JCP e dividendos">
    ${grade}${colunas}</svg>`;
}
