import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: barra de navegacao superior, visivel a partir de
// telas medias (em telas de celular, quem navega e o BottomNav).
export class AppHeader extends BaseComponent {
  template() {
    return `
      <nav class="navbar navbar-expand-md navbar-dark bg-primary d-none d-md-flex">
        <div class="container">
          <span class="navbar-brand">Painel de Ativos B3</span>
          <div class="navbar-nav flex-wrap">
            <a class="nav-link text-white" href="#/estudos">Estudos</a>
            <a class="nav-link text-white" href="#/gestao">Gestão</a>
            <a class="nav-link text-white" href="#/monitorados">Monitorados</a>
            <a class="nav-link text-white" href="#/candles">Velas</a>
            <a class="nav-link text-white" href="#/comunicados">Comunicados</a>
            <a class="nav-link text-white" href="#/formulas">Fórmulas</a>
            <a class="nav-link text-white" href="#/arquitetura">Arquitetura</a>
            <a class="nav-link text-white" href="#/padroes">Padrões</a>
            <a class="nav-link text-white" href="#/glossario">Glossário</a>
            <a class="nav-link text-white" href="#/setores">Setores</a>
            <a class="nav-link text-white" href="#/indices">Índices</a>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('app-header', AppHeader);
