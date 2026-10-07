import { BaseComponent } from './base/BaseComponent.js';
import { GRUPOS, grupoDaRota, rotaAtiva } from '../navegacao.js';
import '../components/BuscaGlobal.js';
import '../components/TemaToggle.js';

// Unica responsabilidade: barra de navegacao superior em grupos, visivel a
// partir de telas medias (em telas de celular, quem navega e o BottomNav).
// Os grupos vem de navegacao.js (definicao unica).
function item(grupo) {
  if (!grupo.itens) {
    return `<a class="nav-link text-white" data-grupo="${grupo.id}" href="${grupo.rota}">${grupo.rotulo}</a>`;
  }
  return `
    <div class="nav-item dropdown" data-grupo="${grupo.id}">
      <a class="nav-link dropdown-toggle text-white" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">${grupo.rotulo}</a>
      <ul class="dropdown-menu">
        ${grupo.itens.map((i) => `<li><a class="dropdown-item" data-rota="${i.rota}" href="${i.rota}">${i.rotulo}</a></li>`).join('')}
      </ul>
    </div>`;
}

export class AppHeader extends BaseComponent {
  template() {
    return `
      <nav class="navbar navbar-expand-md navbar-dark bg-primary d-none d-md-flex" aria-label="Navegação principal">
        <div class="container flex-wrap gap-2">
          <a class="navbar-brand" href="#/inicio">Painel de Ativos B3</a>
          <div class="navbar-nav flex-wrap flex-grow-1">${GRUPOS.map(item).join('')}</div>
          <busca-global style="min-width:220px;"></busca-global>
          <tema-toggle></tema-toggle>
        </div>
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

export function marcarAtivo(raiz, hash) {
  const grupo = grupoDaRota(hash);
  const rota = rotaAtiva(hash);
  raiz.querySelectorAll('[data-grupo]').forEach((el) => {
    const ativo = el.dataset.grupo === grupo;
    el.classList.toggle('nav-grupo-ativo', ativo);
    const link = el.matches('a') ? el : el.querySelector('.nav-link');
    if (link) {
      link.classList.toggle('ativo', ativo);
      if (el.matches('a')) link.toggleAttribute('aria-current', ativo);
    }
  });
  raiz.querySelectorAll('[data-rota]').forEach((el) => el.classList.toggle('active', el.dataset.rota === rota));
}

customElements.define('app-header', AppHeader);
