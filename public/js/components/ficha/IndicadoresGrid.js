import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { esqueleto } from './esqueleto.js';
import { ligarPopovers } from './popovers.js';

// Unica responsabilidade: a grade de indicadores da ficha. Cada bloco mostra
// valor e leitura curta; o clique (ou foco pelo teclado) abre a explicacao -
// o "Como funciona" fica ao lado do numero, nao numa aba separada.
export class IndicadoresGrid extends BaseComponent {
  setIndicadores(indicadores) {
    this._indicadores = indicadores || [];
    this.innerHTML = this.template();
    ligarPopovers(this);
  }

  template() {
    if (!this._indicadores) {
      return `<div class="ficha-kpis">${Array.from({ length: 4 }, () => `<div class="ficha-kpi">${esqueleto(2)}</div>`).join('')}</div>`;
    }
    if (this._indicadores.length === 0) return '';
    return `
      <div class="ficha-kpis">
        ${this._indicadores.map((i) => `
          <button type="button" class="ficha-kpi text-start"
                  data-bs-toggle="popover" data-bs-trigger="hover focus" data-bs-placement="top"
                  data-bs-title="${escaparHtml(i.rotulo)}" data-bs-content="${escaparHtml(i.explicacao)}">
            <span class="ficha-kpi-rotulo">${escaparHtml(i.rotulo)}</span>
            <span class="ficha-kpi-valor">${escaparHtml(i.valor)}</span>
            <span class="ficha-kpi-leitura text-${i.tom === 'secondary' ? 'body-secondary' : `${i.tom}-emphasis`}">${escaparHtml(i.leitura)}</span>
          </button>`).join('')}
      </div>
    `;
  }
}

customElements.define('indicadores-grid', IndicadoresGrid);
