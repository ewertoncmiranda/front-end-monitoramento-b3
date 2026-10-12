import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';

const SEM = '—';
export function htmlOperacoes(operacoes = [], ativos = []) {
  if (operacoes && !Array.isArray(operacoes)) operacoes = operacoes.itens || operacoes.operacoes || [];
  const form = `<form id="form-operacao" class="row g-2 mb-3"><div class="col-md-3"><select id="operacao-ativo" class="form-select form-select-sm" required><option value="">Ativo…</option>${ativos.map((a) => `<option>${escaparHtml(a.simbolo)}</option>`).join('')}</select></div><div class="col-md-3"><input id="operacao-data" type="date" class="form-control form-control-sm" required></div><div class="col-md-2"><input id="operacao-capital" type="number" min="1" value="10000" class="form-control form-control-sm" aria-label="Capital" required></div><div class="col-md-3"><input id="operacao-versao" value="MOMENTO_PURO_v1" class="form-control form-control-sm" aria-label="Versão da estratégia" required></div><div class="col-md-1"><button class="btn btn-primary btn-sm w-100">Criar</button></div></form>`;
  if (!operacoes.length) return `${form}<p class="small text-muted">Nenhuma operação manual cadastrada.</p>`;
  const lista = operacoes.map((o) => {
    const diarios = o.diarios || o.historico || [];
    const pnl = diarios.at(-1)?.pnlRs ?? o.pnlRs;
    const acum = diarios.at(-1)?.retornoAcumPct ?? o.retornoAcumPct;
    const status = o.status || SEM;
    const resumoStatus = status === 'PENDENTE'
      ? `Abertura estimada: ${escaparHtml(formatarData(o.dataAberturaEstimada || o.dataEntrada, SEM))}`
      : status === 'FECHADA'
        ? `Retorno vs CDI: ${escaparHtml(formatarPercentual(o.retornoVsCdi ?? o.excessoCdi, 2, { sinal: true, vazio: SEM }))}`
        : 'Histórico pregão a pregão';
    const detalhe = diarios.length ? `<details><summary>Histórico pregão a pregão</summary><div class="table-responsive"><table class="table table-sm"><tbody>${diarios.map((d) => `<tr><td>${escaparHtml(formatarData(d.dataPregao))}</td><td>${escaparHtml(formatarMoeda(d.pnlRs ?? d.pnlDia, SEM))}</td><td>${escaparHtml(formatarPercentual(d.retornoAcumPct ?? d.pnlAcumulado, 2, { sinal: true, vazio: SEM }))}</td></tr>`).join('')}</tbody></table></div></details>` : '<small class="text-muted">O contrato atual ainda não publicou o acompanhamento pregão a pregão.</small>';
    return `<article class="ficha-cartao mb-2"><div class="d-flex flex-wrap justify-content-between gap-2"><div><strong>${escaparHtml(o.simbolo || SEM)}</strong> <span class="badge text-bg-secondary">${escaparHtml(status)}</span><div class="small">entrada ${escaparHtml(formatarData(o.dataEntrada))} · ${escaparHtml(formatarMoeda(o.capital, SEM))}</div><div class="small text-muted">${resumoStatus}</div></div><div class="text-end"><div>P&L ${escaparHtml(formatarMoeda(pnl, SEM))}</div><div>acumulado ${escaparHtml(formatarPercentual(acum, 2, { sinal: true, vazio: SEM }))}</div>${status === 'PENDENTE' ? `<button class="btn btn-sm btn-outline-danger mt-1" data-excluir-operacao="${o.id}">Excluir</button>` : ''}</div></div>${detalhe}</article>`;
  }).join('');
  return form + lista;
}

export const htmlOperacoesManuais = htmlOperacoes;
