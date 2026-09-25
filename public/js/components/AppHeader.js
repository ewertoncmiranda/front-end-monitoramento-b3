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
            <a class="nav-link text-white" href="#/consulta">Consulta</a>
            <a class="nav-link text-white" href="#/cadastro">Cadastro</a>
            <a class="nav-link text-white" href="#/monitorados">Monitorados</a>
            <a class="nav-link text-white" href="#/metodologia">Como funciona</a>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('app-header', AppHeader);
