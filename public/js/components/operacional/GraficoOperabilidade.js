// Unica responsabilidade: grafico do paper trading (OPR-PAI-4): retorno liquido acumulado x CDI liquido
// de IR (linhas) e drawdown (area abaixo), mais a tabela do diario para auditar cada pregao. Puro:
// devolve strings; cores por variaveis do Bootstrap (claro/escuro). Ponto sem dado quebra a linha:
// nunca desenha zero falso.
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { STATUS, statusDe } from '../../analise/operabilidade.js';

const L = 560;
const A = 220;
const M = { topo: 10, base: 24, esq: 46, dir: 8 };
const ALTURA_DD = 52; // faixa do drawdown, abaixo das linhas

const numero = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/** Pontos em ordem de data, com os campos numericos normalizados (null = sem dado). */
export function pontosDoDiario(itens) {
  return [...(itens || [])]
    .filter((d) => d && d.dataPregao)
    .sort((a, b) => (a.dataPregao < b.dataPregao ? -1 : a.dataPregao > b.dataPregao ? 1 : 0))
    .map((d) => ({
      data: d.dataPregao, carteira: numero(d.retornoLiquidoAcumulado), cdi: numero(d.cdiLiquidoIrAcumulado),
      drawdown: numero(d.drawdown), bruto: d,
    }));
}

/** Caminho SVG que pula pontos null (cada trecho continuo vira um "M ... L ..."). */
export function caminho(pontos, chave, x, y) {
  let d = '';
  let aberto = false;
  pontos.forEach((p, i) => {
    const v = p[chave];
    if (v === null) { aberto = false; return; }
    d += `${aberto ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    aberto = true;
  });
  return d.trim();
}

export function svgOperabilidade(itens) {
  const pontos = pontosDoDiario(itens);
  if (!pontos.length) return '';
  const valores = pontos.flatMap((p) => [p.carteira, p.cdi]).filter((v) => v !== null);
  const min = Math.min(0, ...valores);
  const max = Math.max(0.001, ...valores);
  const larguraUtil = L - M.esq - M.dir;
  const baseLinhas = A - M.base - ALTURA_DD - 8;
  const x = (i) => M.esq + (pontos.length === 1 ? larguraUtil / 2 : (i * larguraUtil) / (pontos.length - 1));
  const y = (v) => M.topo + ((max - v) / (max - min)) * (baseLinhas - M.topo);
  const ddMin = Math.min(-0.01, ...pontos.map((p) => p.drawdown).filter((v) => v !== null));
  const topoDd = A - M.base - ALTURA_DD;
  const yDd = (v) => topoDd + (v / ddMin) * ALTURA_DD;

  const grade = [max, (max + min) / 2, min].map((v) => `<line class="grade" x1="${M.esq}" y1="${y(v).toFixed(1)}" x2="${L - M.dir}" y2="${y(v).toFixed(1)}"/>
    <text class="rotulo-y" x="${M.esq - 4}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${escaparHtml(formatarPercentual(v, 1))}</text>`).join('');
  const zero = `<line class="eixo" x1="${M.esq}" y1="${y(0).toFixed(1)}" x2="${L - M.dir}" y2="${y(0).toFixed(1)}"/>`;
  const barras = pontos.map((p, i) => (p.drawdown === null || p.drawdown === 0 ? '' : `<line class="drawdown" x1="${x(i).toFixed(1)}" y1="${topoDd}" x2="${x(i).toFixed(1)}" y2="${yDd(p.drawdown).toFixed(1)}"/>`)).join('');
  const marcas = [0, Math.floor((pontos.length - 1) / 2), pontos.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((i) => {
      // primeira e ultima ancoradas na borda: no meio, o texto sai cortado do viewBox
      const ancora = pontos.length > 1 && i === 0 ? 'start' : pontos.length > 1 && i === pontos.length - 1 ? 'end' : 'middle';
      return `<text class="rotulo-x" x="${x(i).toFixed(1)}" y="${A - 8}" text-anchor="${ancora}">${escaparHtml(formatarData(pontos[i].data))}</text>`;
    }).join('');
  const ultimo = pontos[pontos.length - 1];
  const titulo = `Retorno líquido acumulado ${formatarPercentual(ultimo.carteira, 2, { vazio: 'sem dado' })} contra CDI líquido ${formatarPercentual(ultimo.cdi, 2, { vazio: 'sem dado' })}`;
  return `<svg class="grafico-operabilidade" viewBox="0 0 ${L} ${A}" role="img" aria-label="${escaparHtml(titulo)}">
    ${grade}${zero}
    <path class="linha-cdi" d="${caminho(pontos, 'cdi', x, y)}"/>
    <path class="linha-carteira" d="${caminho(pontos, 'carteira', x, y)}"/>
    <text class="rotulo-y" x="${M.esq - 4}" y="${topoDd + 10}" text-anchor="end">DD</text>
    <line class="eixo" x1="${M.esq}" y1="${topoDd}" x2="${L - M.dir}" y2="${topoDd}"/>${barras}
    <text class="rotulo-y" x="${M.esq - 4}" y="${topoDd + ALTURA_DD}" text-anchor="end">${escaparHtml(formatarPercentual(ddMin, 0))}</text>
    ${marcas}
  </svg>`;
}

export function htmlLegenda() {
  return `<p class="small mb-1 legenda-operabilidade">
    <span class="marca-legenda carteira"></span> Carteira simulada (líquida de custos e IR estimado)
    <span class="marca-legenda cdi ms-3"></span> CDI líquido de IR
    <span class="marca-legenda drawdown ms-3"></span> Drawdown</p>`;
}

/** Tabela acessivel do diario (mais recente primeiro): um pregao por linha, sem dado como "sem dado". */
export function htmlTabelaDiario(itens) {
  const pontos = pontosDoDiario(itens).reverse();
  if (!pontos.length) return '<p class="small text-muted mb-0">Diário ainda não iniciado.</p>';
  const pct = (v) => escaparHtml(formatarPercentual(v, 2, { sinal: true, vazio: 'sem dado' }));
  const linhas = pontos.map(({ bruto: d }) => {
    const st = STATUS[statusDe(d.statusSistema)];
    return `<tr>
      <td>${escaparHtml(formatarData(d.dataPregao))}</td>
      <td class="text-end">${escaparHtml(formatarMoeda(d.patrimonio, 'sem dado'))}</td>
      <td class="text-end">${pct(d.retornoLiquidoDia)}</td>
      <td class="text-end">${pct(d.retornoLiquidoAcumulado)}</td>
      <td class="text-end">${pct(d.cdiLiquidoIrAcumulado)}</td>
      <td class="text-end">${pct(d.excessoSobreCdiLiquido)}</td>
      <td class="text-end">${escaparHtml(formatarPercentual(d.drawdown, 2, { vazio: 'sem dado' }))}</td>
      <td class="text-end">${escaparHtml(String(d.posicoesAbertas ?? 'sem dado'))}</td>
      <td><span class="badge ${st.classe}">${escaparHtml(st.rotulo)}</span></td>
    </tr>`;
  }).join('');
  return `<div class="table-responsive tabela-diario"><table class="table table-sm align-middle mb-0">
    <caption class="visually-hidden">Diário operacional simulado, um pregão por linha</caption>
    <thead><tr><th scope="col">Pregão</th><th scope="col" class="text-end">Patrimônio</th><th scope="col" class="text-end">Dia</th>
      <th scope="col" class="text-end">Acumulado</th><th scope="col" class="text-end">CDI líq.</th><th scope="col" class="text-end">Excesso</th>
      <th scope="col" class="text-end">Drawdown</th><th scope="col" class="text-end">Posições</th><th scope="col">Status</th></tr></thead>
    <tbody>${linhas}</tbody></table></div>`;
}
