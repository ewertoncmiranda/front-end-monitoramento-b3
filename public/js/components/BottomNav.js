import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: navegacao inferior estilo app mobile. Some em
// telas medias/grandes, onde o AppHeader assume a navegacao.
export class BottomNav extends BaseComponent {
  template() {
    return `
      <nav class="app-bottom-nav navbar fixed-bottom navbar-light bg-white border-top d-flex d-md-none">
        <div class="container d-flex justify-content-around">
          <a class="nav-link text-center" href="#/consulta">
            <div>🔍</div>
            <small>Consulta</small>
          </a>
          <a class="nav-link text-center" href="#/cadastro">
            <div>➕</div>
            <small>Cadastro</small>
          </a>
          <a class="nav-link text-center" href="#/monitorados">
            <div>📋</div>
            <small>Monitorados</small>
          </a>
          <a class="nav-link text-center" href="#/metodologia">
            <div>📐</div>
            <small>Como funciona</small>
          </a>
        </div>
      </nav>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);
