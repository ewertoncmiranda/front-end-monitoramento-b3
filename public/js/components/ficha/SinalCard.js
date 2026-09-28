import { BaseComponent } from '../base/BaseComponent.js';
import { VEREDITOS, dataBr, historicoDoSinal, leituraDaRecomendacao } from '../../analise/fichaDoAtivo.js';
import { formatarIcPercentual, formatarPercentual, formatarTaxaComIc, nomeDaVersaoDoDiario } from '../../analise/diarioDeSinais.js';
import { escaparHtml } from '../../utils/html.js';
import { esqueleto } from './esqueleto.js';

const HORIZONTE = 63;
const RISCO = { BAIXO: 'success', MEDIO: 'warning', ALTO: 'danger' };

// Unica responsabilidade: o cartao de decisao - o sinal da ultima analise
// (regra, risco, confianca) e, ao lado, o que o backtest diz desse mesmo
// sinal no periodo de teste. Mostrar os dois juntos e o ponto: o sinal vem
// com a prova (ou a falta dela) de que funcionou.
export class SinalCard extends BaseComponent {
  /** fundamentos: /analises/{s}/fundamentos; backtest: /validacao/backtest (pode faltar). */
  setDados({ fundamentos, backtest }) {
    this._fundamentos = fundamentos;
    this._backtest = backtest;
    this._carregado = true;
    this.innerHTML = this.template();
  }

  template() {
    if (!this._carregado) return `<section class="ficha-cartao h-100">${esqueleto(5)}</section>`;
    const f = this._fundamentos;
    if (!f?.detalhes) {
      return `<section class="ficha-cartao h-100">
        <p class="ficha-rotulo">Sinal</p>
        <p class="mb-0 text-body-secondary">Ainda não há análise para este ativo. Ele entra na próxima rodada de insights se tiver balanço na CVM e pregões no COTAHIST.</p>
      </section>`;
    }
    const d = f.detalhes;
    const rec = leituraDaRecomendacao(f.recomendacao);
    const confianca = Number(d.resumo?.confianca_score ?? 0);
    const risco = d.resumo?.nivel_risco;
    const versao = d.versao_regra;
    const historico = historicoDoSinal(this._backtest?.placar, versao, f.recomendacao, HORIZONTE);

    return `
      <section class="ficha-cartao h-100 d-flex flex-column">
        <p class="ficha-rotulo">Sinal da regra ${escaparHtml(nomeDaVersaoDoDiario(versao))}
          <span class="text-body-tertiary">· pregão ${dataBr(d.data_pregao_referencia)}</span></p>
        <div class="d-flex align-items-center gap-2 flex-wrap mb-3">
          <span class="ficha-recomendacao ficha-tom-${rec.tom}">${rec.rotulo}</span>
          ${risco ? `<span class="badge rounded-pill text-bg-${RISCO[risco] || 'secondary'} bg-opacity-75">risco ${risco.toLowerCase()}</span>` : ''}
        </div>

        <div class="d-flex justify-content-between small mb-1">
          <span class="text-body-secondary">Confiança</span><span>${confianca} / 100</span>
        </div>
        <div class="progress ficha-progresso mb-3" role="progressbar" aria-label="Confiança" aria-valuenow="${confianca}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar" style="width:${confianca}%"></div>
        </div>

        ${this.fatores(d.fatores_decisao)}
        ${this.historico(historico)}
        <p class="small text-body-tertiary mt-auto mb-0 pt-2">${escaparHtml(d.aviso_legal || 'Sinal quantitativo para estudo, não recomendação de investimento.')}</p>
      </section>
    `;
  }

  fatores(fatores) {
    if (!fatores) return '';
    const chip = (texto, tom) => `<span class="ficha-chip ficha-chip-${tom}">${escaparHtml(texto.replaceAll('_', ' '))}</span>`;
    const chips = [
      ...(fatores.positivos || []).map((t) => chip(t, 'success')),
      ...(fatores.negativos || []).map((t) => chip(t, 'danger')),
      ...(fatores.neutros || []).map((t) => chip(t, 'secondary')),
    ];
    return chips.length ? `<div class="d-flex flex-wrap gap-1 mb-3" aria-label="Fatores da decisão">${chips.join('')}</div>` : '';
  }

  historico(h) {
    if (!this._backtest) {
      return '<p class="small text-body-secondary mb-2">Backtest indisponível agora.</p>';
    }
    if (!h) {
      return '<p class="small text-body-secondary mb-2">Este sinal não aparece no período de teste do backtest.</p>';
    }
    const veredito = VEREDITOS[h.veredito];
    return `
      <div class="ficha-historico">
        <div class="d-flex justify-content-between align-items-center mb-1 gap-2 flex-wrap">
          <span class="small text-body-secondary">Quando a regra disse isso (teste, ${HORIZONTE} pregões, ${h.avaliados} vezes)</span>
          <span class="ficha-chip ficha-chip-${veredito.tom}"><span aria-hidden="true">${veredito.icone}</span> ${veredito.rotulo}</span>
        </div>
        <div class="row g-2 small">
          <div class="col-6">
            <div class="text-body-secondary">Acerto</div>
            <div>${formatarTaxaComIc(h.taxaAcerto, h.icAcerto)}</div>
          </div>
          <div class="col-6">
            <div class="text-body-secondary">Ativo vs carteira</div>
            <div>${formatarPercentual(h.excessoMedioCarteira)} <span class="text-body-tertiary">(${formatarIcPercentual(h.icExcessoCarteira)})</span></div>
          </div>
        </div>
        <a class="small link-secondary" href="#/avaliacao">Ver o placar completo →</a>
      </div>
    `;
  }
}

customElements.define('sinal-card', SinalCard);
