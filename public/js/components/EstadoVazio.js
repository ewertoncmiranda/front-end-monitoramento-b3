import { BaseComponent } from './base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';

// Unica responsabilidade: estado vazio que explica a causa e o proximo passo
// (REQ-UX-1). Atributos: titulo, causa, acao-href, acao-rotulo.
export function htmlEstadoVazio({ titulo, causa, acaoHref, acaoRotulo }) {
  return `<div class="estado-vazio text-center text-muted border rounded p-4" role="status">
    <p class="fw-semibold mb-1">${escaparHtml(titulo || 'Sem dado ainda')}</p>
    ${causa ? `<p class="small mb-0">${escaparHtml(causa)}</p>` : ''}
    ${acaoHref ? `<a class="btn btn-sm btn-outline-primary mt-2" href="${escaparHtml(acaoHref)}">${escaparHtml(acaoRotulo || 'Ver')}</a>` : ''}
  </div>`;
}

export class EstadoVazio extends BaseComponent {
  template() {
    return htmlEstadoVazio({
      titulo: this.getAttribute('titulo'),
      causa: this.getAttribute('causa'),
      acaoHref: this.getAttribute('acao-href'),
      acaoRotulo: this.getAttribute('acao-rotulo'),
    });
  }
}

customElements.define('estado-vazio', EstadoVazio);
