import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: mostrar uma mensagem de status (sucesso/erro/aviso)
// no padrao de alerta do Bootstrap. Reutilizado por qualquer pagina que
// precise dar feedback ao usuario.
export class StatusAlert extends BaseComponent {
  static get observedAttributes() {
    return ['mensagem', 'variante'];
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.innerHTML = this.template();
    }
  }

  template() {
    const mensagem = this.getAttribute('mensagem') || '';
    const variante = this.getAttribute('variante') || 'info';
    if (!mensagem) {
      return '';
    }
    return `
      <div class="alert alert-${variante}" role="alert">
        ${mensagem}
      </div>
    `;
  }
}

customElements.define('status-alert', StatusAlert);
