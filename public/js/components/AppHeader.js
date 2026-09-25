import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: barra de navegacao superior, visivel a partir de
// telas medias (em telas de celular, quem navega e o BottomNav).
export class AppHeader extends BaseComponent {
  template() {
    return `
      <nav class="navbar navbar-expand-md navbar-dark bg-primary d-none d-md-flex">
        <div class="container">
          <span class="navbar-brand">Painel de Ativos B3</span>
          <div class="navbar-nav">
            <a class="nav-link text-white" href="#/gestao">Gestao</a>
            <a class="nav-link text-white" href="#/monitorados">Monitorados</a>
            <a class="nav-link text-white" href="#/candles">Candles</a>
            <a class="nav-link text-white" href="#/formulas">Formulas</a>
            <a class="nav-link text-white" href="#/arquitetura">Arquitetura</a>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('app-header', AppHeader);
