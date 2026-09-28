import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { esqueleto } from './esqueleto.js';
import { ligarPopovers } from './popovers.js';

const ICONE = { success: '✓', warning: '!', info: 'i', danger: '✕' };

// Unica responsabilidade: mostrar a procedencia dos numeros da ficha como
// selos (fonte e data do preco, balanco da CVM, LPA usado, serie tecnica,
// idade da analise). Cada selo abre um popover dizendo de onde veio o dado.
export class SelosQualidade extends BaseComponent {
  setSelos(selos) {
    this._selos = selos || [];
    this.innerHTML = this.template();
    ligarPopovers(this);
  }

  template() {
    if (!this._selos) return `<section class="ficha-cartao">${esqueleto(1)}</section>`;
    const pendentes = this._selos.filter((s) => s.tom === 'warning' || s.tom === 'danger').length;
    return `
      <section class="ficha-cartao">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <p class="ficha-rotulo mb-0">Qualidade dos dados</p>
          <span class="small ${pendentes ? 'text-warning-emphasis' : 'text-success'}">
            ${pendentes ? `${pendentes} ponto${pendentes > 1 ? 's' : ''} de atenção` : 'Tudo em dia'}
          </span>
        </div>
        <div class="d-flex flex-wrap gap-2">
          ${this._selos.map((s) => `
            <button type="button" class="ficha-chip ficha-chip-${s.tom} ficha-chip-botao"
                    data-bs-toggle="popover" data-bs-trigger="hover focus" data-bs-placement="top"
                    data-bs-content="${escaparHtml(s.ajuda)}">
              <span aria-hidden="true">${ICONE[s.tom] || ''}</span> ${escaparHtml(s.texto)}
            </button>`).join('')}
        </div>
      </section>
    `;
  }
}

customElements.define('selos-qualidade', SelosQualidade);
