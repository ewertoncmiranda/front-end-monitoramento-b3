import { BaseComponent } from './base/BaseComponent.js';
import { GRUPOS } from '../navegacao.js';
import { marcarAtivo } from './AppHeader.js';

// Unica responsabilidade: navegacao inferior estilo app mobile, nos mesmos 5
// grupos do menu superior (navegacao.js). Grupo com varias paginas abre um
// menu para cima. Some em telas medias/grandes.
function item(g) {
  if (!g.itens) {
    return `<a class="nav-link text-center flex-fill px-1" data-grupo="${g.id}" href="${g.rota}">
      <div aria-hidden="true">${g.icone}</div><small>${g.rotulo}</small></a>`;
  }
  return `<div class="dropup flex-fill text-center" data-grupo="${g.id}">
    <a class="nav-link px-1" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
      <div aria-hidden="true">${g.icone}</div><small>${g.rotulo}</small></a>
    <ul class="dropdown-menu">
      ${g.itens.map((i) => `<li><a class="dropdown-item" data-rota="${i.rota}" href="${i.rota}">${i.rotulo}</a></li>`).join('')}
    </ul></div>`;
}

export class BottomNav extends BaseComponent {
  template() {
    return `
      <nav class="app-bottom-nav navbar fixed-bottom navbar-light bg-white border-top d-flex d-md-none" aria-label="Navegação principal">
        <div class="container d-flex flex-nowrap justify-content-around">${GRUPOS.map(item).join('')}</div>
      </nav>
    `;
  }

  afterRender() {
    this._marcar = () => marcarAtivo(this, window.location.hash);
    window.addEventListener('hashchange', this._marcar);
    this._marcar();
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this._marcar);
  }
}

customElements.define('bottom-nav', BottomNav);
