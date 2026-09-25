import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: navegacao inferior estilo app mobile. Some em
// telas medias/grandes, onde o AppHeader assume a navegacao.
export class BottomNav extends BaseComponent {
  template() {
    return `
      <nav class="app-bottom-nav navbar fixed-bottom navbar-light bg-white border-top d-flex d-md-none">
        <div class="container d-flex flex-nowrap overflow-x-auto justify-content-start justify-content-sm-around">
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/gestao">
            <div>🗂️</div>
            <small>Gestao</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/monitorados">
            <div>📋</div>
            <small>Monitorados</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/candles">
            <div>🕯️</div>
            <small>Candles</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/formulas">
            <div>🧮</div>
            <small>Formulas</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/arquitetura">
            <div>🧩</div>
            <small>Arquitetura</small>
          </a>
        </div>
      </nav>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);
