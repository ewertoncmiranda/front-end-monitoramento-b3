import { BaseComponent } from './base/BaseComponent.js';
import { buscarBacktestRanking } from '../api/lacunasApi.js';
import { VEREDITO_RANKING, janelasPorVersao, vereditoDoRanking } from '../analise/lacunas.js';
import { formatarDataHora } from '../utils/dataHora.js';
import { escaparHtml } from '../utils/html.js';
import './LoadingSpinner.js';

// Unica responsabilidade: placar por ranking (LAC-FE-1), ao lado do placar por
// classes. Por versao da regra e janela: correlacao de Spearman media com IC
// 95%, retorno por quintil e a hipotese registrada ANTES da execucao.
// Dados de /validacao/backtest?metodo=RANKING (LAC-GES-1).
export class PlacarRanking extends BaseComponent {
  template() {
    return '<div data-corpo><loading-spinner></loading-spinner></div>';
  }

  async afterRender() {
    const corpo = this.querySelector('[data-corpo]');
    try {
      corpo.innerHTML = renderizar(await buscarBacktestRanking());
    } catch (erro) {
      corpo.innerHTML = `<div class="alert alert-secondary small mb-0">Sem dado ainda: o backtest por ranking não está disponível
        (${escaparHtml(erro.message)}).</div>`;
    }
  }
}

const pct = (v) => (v === null || v === undefined ? '—' : `${(Number(v) * 100).toFixed(2).replace('.', ',')}%`);
const num = (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(3).replace('.', ','));

export function renderizar(dados) {
  if (!dados || !dados.execucao || !(dados.janelas || []).length) {
    return '<div class="alert alert-info small mb-0">Nenhum backtest por ranking rodou ainda.</div>';
  }
  const e = dados.execucao;
  return `
    <div class="alert alert-light border small">
      <strong>Hipótese registrada antes da execução:</strong> ${escaparHtml(e.hipotese || 'não registrada')}
      <div class="text-muted mt-1">Execução #${e.id} em ${escaparHtml(formatarDataHora(e.finalizadoEm, '—'))}
        ${e.numeroTentativa ? `· tentativa ${e.numeroTentativa}` : ''}
        ${e.esquemaValidacao ? `· ${escaparHtml(e.esquemaValidacao)}` : ''}</div>
    </div>
    ${janelasPorVersao(dados.janelas).map((g) => `
      <h6 class="mt-3">Regra ${escaparHtml(g.versao)}</h6>
      <div class="row g-2">${g.janelas.map((j) => cartao(j)).join('')}</div>`).join('')}
    <p class="small text-muted mt-3 mb-0">${escaparHtml(dados.aviso || 'Regra experimental: correlação não é recomendação.')}
      Só conta como evidência quando o intervalo de confiança fica todo acima de zero e se repete em janelas sucessivas.</p>`;
}

function cartao(j) {
  const veredito = VEREDITO_RANKING[vereditoDoRanking(j)];
  const ic = j.icCorrelacao && j.icCorrelacao.inferior !== null && j.icCorrelacao.inferior !== undefined
    ? `IC 95%: ${num(j.icCorrelacao.inferior)} a ${num(j.icCorrelacao.superior)}`
    : 'IC indisponível (menos de 2 meses)';
  const maximo = Math.max(0.0001, ...(j.quintis || []).map((q) => Math.abs(Number(q.retornoMedio) || 0)));
  return `<div class="col-md-6"><div class="border rounded p-2 h-100">
    <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
      <strong>${escaparHtml(j.janela)} · ${j.horizonte} pregões</strong>
      <span class="badge ${veredito.classe}">${veredito.rotulo}</span>
    </div>
    <div class="fs-5">${num(j.correlacaoRankingMedia)} <span class="small text-muted">correlação média (Spearman)</span></div>
    <div class="small text-muted">${ic} · ${j.meses} meses${j.ativosPorMes ? ` · ~${j.ativosPorMes} ativos/mês` : ''}</div>
    <div class="mt-2">${(j.quintis || []).map((q) => {
      const valor = Number(q.retornoMedio) || 0;
      const largura = Math.round((Math.abs(valor) / maximo) * 100);
      return `<div class="d-flex align-items-center gap-2 small">
        <span style="width:2.5rem">Q${q.quintil}</span>
        <div class="flex-grow-1 bg-body-tertiary rounded" style="height:.6rem"><div class="${valor >= 0 ? 'bg-success' : 'bg-danger'} rounded" style="width:${largura}%;height:100%"></div></div>
        <span style="width:4.5rem" class="text-end">${pct(q.retornoMedio)}</span></div>`;
    }).join('')}</div>
    <div class="small mt-1">Q5 − Q1: <strong>${pct(j.diferencaQuintil5Menos1)}</strong> <span class="text-muted">(Q1 pior ranking, Q5 melhor)</span></div>
  </div></div>`;
}

customElements.define('placar-ranking', PlacarRanking);
