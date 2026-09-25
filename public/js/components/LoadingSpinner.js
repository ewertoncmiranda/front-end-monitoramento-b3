import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: mostrar um indicador de carregamento do Bootstrap.
export class LoadingSpinner extends BaseComponent {
  template() {
    return `
      <div class="d-flex justify-content-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>
    `;
  }
}

customElements.define('loading-spinner', LoadingSpinner);
