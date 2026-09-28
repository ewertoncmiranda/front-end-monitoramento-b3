import { BaseComponent } from './base/BaseComponent.js';
import '../components/BuscaGlobal.js';

// Unica responsabilidade: barra de navegacao superior, visivel a partir de
// telas medias (em telas de celular, quem navega e o BottomNav).
export class AppHeader extends BaseComponent {
  template() {
    return `
      <nav class="navbar navbar-expand-md navbar-dark bg-primary d-none d-md-flex">
        <div class="container flex-wrap gap-2">
          <span class="navbar-brand">Painel de Ativos B3</span>
          <div class="navbar-nav flex-wrap flex-grow-1">
            <a class="nav-link text-white" href="#/estudos">Estudos</a>
            <a class="nav-link text-white" href="#/gestao">Gestão</a>
            <a class="nav-link text-white" href="#/base">Base</a>
            <a class="nav-link text-white" href="#/favoritos">Favoritos</a>
            <a class="nav-link text-white" href="#/candles">Velas</a>
            <a class="nav-link text-white" href="#/comunicados">Comunicados</a>
            <a class="nav-link text-white" href="#/noticias">Notícias</a>
            <a class="nav-link text-white" href="#/avaliacao">Avaliação</a>
            <a class="nav-link text-white" href="#/setores">Setores</a>
            <a class="nav-link text-white" href="#/indices">Índices</a>
          </div>
          <busca-global style="min-width:220px;"></busca-global>
        </div>
      </nav>
    `;
  }
}

customElements.define('app-header', AppHeader);
