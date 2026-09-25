import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: renderizar a cotacao de um ativo (contrato `Ativo`
// devolvido por GET /ativos/{ativo} e /ativos/robusto/{ativo}).
export class AtivoQuoteCard extends BaseComponent {
  setAtivo(ativo) {
    this._ativo = ativo;
    this.innerHTML = this.template();
  }

  template() {
    const a = this._ativo;
    if (!a) {
      return '';
    }
    const variacao = Number(a.regularMarketChangePercent || 0);
    const corBadge = variacao >= 0 ? 'bg-success' : 'bg-danger';

    return `
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="card-title mb-0">${a.symbol || ''}</h5>
              <p class="text-muted small mb-2">${a.shortName || ''}</p>
            </div>
            <span class="badge ${corBadge}">${variacao.toFixed(2)}%</span>
          </div>
          <p class="fs-4 fw-semibold mb-1">R$ ${formatar(a.regularMarketPrice)}</p>
          <div class="row row-cols-2 g-2 small text-muted">
            <div class="col">Abertura: R$ ${formatar(a.regularMarketOpen)}</div>
            <div class="col">Fech. anterior: R$ ${formatar(a.regularMarketPreviousClose)}</div>
            <div class="col">Maxima: R$ ${formatar(a.regularMarketDayHigh)}</div>
            <div class="col">Minima: R$ ${formatar(a.regularMarketDayLow)}</div>
          </div>
        </div>
      </div>
    `;
  }
}

function formatar(valor) {
  return Number(valor || 0).toFixed(2);
}

customElements.define('ativo-quote-card', AtivoQuoteCard);
