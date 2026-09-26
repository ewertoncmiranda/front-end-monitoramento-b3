import { BaseComponent } from './base/BaseComponent.js';
import { badgeClassParaRecomendacao } from '../utils/recomendacaoBadge.js';

// Unica responsabilidade: renderizar a decisao consolidada devolvida por
// GET /analises/{simbolo}/analise (contrato RespostaAnaliseIaDTO).
export class AnaliseResultCard extends BaseComponent {
  setAnalise(analise) {
    this._analise = analise;
    this.innerHTML = this.template();
  }

  template() {
    const r = this._analise;
    if (!r) {
      return '';
    }

    const badge = badgeClassParaRecomendacao(r.recomendacao);

    return `
      <div class="card shadow-sm mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span class="fw-semibold">${r.ativo || ''}</span>
          <span class="badge ${badge}">${r.recomendacao || 'SEM_DADOS'}</span>
        </div>
        <div class="card-body">
          <p class="mb-2">${r.resumo || ''}</p>
          <div class="row row-cols-2 g-2 small">
            <div class="col"><strong>Sentimento:</strong> ${r.sentimento || '-'}</div>
            <div class="col"><strong>Risco:</strong> ${r.risco || '-'}</div>
            <div class="col"><strong>Forca do sinal:</strong> ${r.forca_sinal || '-'}</div>
            <div class="col"><strong>Confiança:</strong> ${formatarConfianca(r.confianca_analise)}</div>
          </div>
        </div>
      </div>
    `;
  }
}

function formatarConfianca(valor) {
  if (valor === undefined || valor === null) {
    return '-';
  }
  return `${(Number(valor) * 100).toFixed(0)}%`;
}

customElements.define('analise-result-card', AnaliseResultCard);
