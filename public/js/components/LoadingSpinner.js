import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: mostrar um indicador de carregamento do Bootstrap.
// Se demorar mais que `limite-s` (padrao 12 s), avisa e aponta a Saude dos
// dados em vez de girar para sempre (REQ-UX-1).
export const LIMITE_PADRAO_S = 12;

export class LoadingSpinner extends BaseComponent {
  template() {
    return `
      <div class="d-flex flex-column align-items-center my-4 gap-2">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="small text-muted text-center mb-0 d-none" data-demora role="status">
          Está demorando mais que o normal. O serviço pode estar ocupado ou parado —
          confira a <a href="#/avaliacao">saúde dos dados</a>.
        </p>
      </div>
    `;
  }

  afterRender() {
    const limite = Number(this.getAttribute('limite-s')) || LIMITE_PADRAO_S;
    this._timer = setTimeout(() => this.querySelector('[data-demora]')?.classList.remove('d-none'), limite * 1000);
  }

  disconnectedCallback() {
    clearTimeout(this._timer);
  }
}

customElements.define('loading-spinner', LoadingSpinner);
