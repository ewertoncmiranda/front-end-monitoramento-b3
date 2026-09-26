import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: navegacao inferior estilo app mobile. Some em
// telas medias/grandes, onde o AppHeader assume a navegacao.
export class BottomNav extends BaseComponent {
  template() {
    return `
      <nav class="app-bottom-nav navbar fixed-bottom navbar-light bg-white border-top d-flex d-md-none">
        <div class="container d-flex flex-nowrap overflow-x-auto justify-content-start justify-content-sm-around">
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/estudos">
            <div aria-hidden="true">🎓</div>
            <small>Estudos</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/gestao">
            <div>🗂️</div>
            <small>Gestão</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/monitorados">
            <div>📋</div>
            <small>Monitorados</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/candles">
            <div>🕯️</div>
            <small>Velas</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/comunicados">
            <div aria-hidden="true">📰</div>
            <small>Comunicados</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/noticias">
            <div aria-hidden="true">🗞️</div>
            <small>Notícias</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/avaliacao">
            <div aria-hidden="true">🩺</div>
            <small>Avaliação</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/setores">
            <div>🏭</div>
            <small>Setores</small>
          </a>
          <a class="nav-link text-center flex-shrink-0 px-2" href="#/indices">
            <div>📊</div>
            <small>Índices</small>
          </a>
        </div>
      </nav>
    `;
  }
}

customElements.define('bottom-nav', BottomNav);
