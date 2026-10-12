import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';

const SEM = '—';
export function htmlFormularioRetroativo(ativos = []) {
  return `<form id="form-retroativo" class="row g-3"><div class="col-md-3"><label class="form-label" for="retroativo-ativo">Ativo</label><select id="retroativo-ativo" class="form-select form-select-sm" required><option value="">Selecione…</option>${ativos.map((a) => `<option>${escaparHtml(a.simbolo)}</option>`).join('')}</select></div>
  <div class="col-md-3"><label class="form-label" for="retroativo-estrategia">Estratégia</label><input id="retroativo-estrategia" class="form-control form-control-sm" value="MOMENTO_PURO" required></div>
  <div class="col-md-2"><label class="form-label" for="retroativo-janela">Janela</label><input id="retroativo-janela" type="number" min="1" max="63" value="21" class="form-control form-control-sm" required></div>
  <div class="col-md-2"><label class="form-label" for="retroativo-inicio">Início</label><input id="retroativo-inicio" type="date" class="form-control form-control-sm" required></div>
  <div class="col-md-2"><label class="form-label">&nbsp;</label><button class="btn btn-primary btn-sm w-100">Analisar</button></div></form>`;
}
export const htmlControlesRetroativo = htmlFormularioRetroativo;

export function htmlResultadoRetroativo(dado) {
  if (dado && Array.isArray(dado.itens) && !dado.itens.length) return '<p class="small text-muted mt-3">Sem dados no período selecionado. Ajuste a janela, o ativo ou o intervalo histórico.</p>';
  const entradas = dado?.entradas || [];
  if (!dado || !entradas.length) return '<p class="small text-muted mt-3">Nenhuma entrada com resultado real foi encontrada no período.</p>';
  const ordenadas = entradas.filter((e) => e.resultadoPercentual != null).sort((a, b) => Number(a.resultadoPercentual) - Number(b.resultadoPercentual));
  const pior = ordenadas[0]; const melhor = ordenadas.at(-1);
  const barras = ['GANHO', 'PERDA', 'NEUTRO'].map((tipo) => { const n = entradas.filter((e) => e.resultado === tipo).length; const pct = entradas.length ? n / entradas.length * 100 : 0; return `<div class="mb-2"><div class="d-flex justify-content-between small"><span>${tipo}</span><span>${n}</span></div><div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div></div>`; }).join('');
  return `<section class="mt-3"><div class="row g-2"><div class="col-md-3"><div class="opr-kpi"><span>Taxa de acerto</span><strong>${escaparHtml(formatarPercentual(dado.taxaAcerto == null ? null : Number(dado.taxaAcerto) / 100, 2, { vazio: SEM }))}</strong></div></div><div class="col-md-3"><div class="opr-kpi"><span>Retorno médio</span><strong>${escaparHtml(formatarPercentual(dado.retornoMedio, 2, { sinal: true, vazio: SEM }))}</strong></div></div><div class="col-md-3"><div class="opr-kpi"><span>Melhor entrada</span><strong>${melhor ? escaparHtml(formatarData(melhor.dataPregao)) : SEM}</strong></div></div><div class="col-md-3"><div class="opr-kpi"><span>Pior entrada</span><strong>${pior ? escaparHtml(formatarData(pior.dataPregao)) : SEM}</strong></div></div></div><div class="mt-3">${barras}</div></section>`;
}
