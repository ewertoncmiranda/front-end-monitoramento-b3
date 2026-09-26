import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: renderizar em cards as manchetes de mercado
// buscadas por ticker (Google News RSS, via /noticias/{ticker} do proprio
// server.js). Complementar aos Comunicados oficiais da CVM - aqui e midia,
// nao o texto que a empresa e obrigada a publicar.
export class NoticiasSecao extends BaseComponent {
  connectedCallback() {
    this._estado = 'carregando';
    this._noticias = [];
    super.connectedCallback();
  }

  setCarregando() {
    this._estado = 'carregando';
    this.innerHTML = this.template();
  }

  setNoticias(noticias) {
    this._estado = 'pronto';
    this._noticias = noticias || [];
    this.innerHTML = this.template();
  }

  setErro() {
    this._estado = 'erro';
    this.innerHTML = this.template();
  }

  template() {
    if (this._estado === 'erro') {
      return '<p class="text-muted small mb-0">Não foi possível buscar notícias agora.</p>';
    }
    if (this._estado === 'carregando') {
      return '<loading-spinner></loading-spinner>';
    }
    if (!this._noticias.length) {
      return '<p class="text-muted small mb-0">Nenhuma notícia recente encontrada para este ativo.</p>';
    }
    return `
      <div class="row row-cols-1 row-cols-md-2 g-3">
        ${this._noticias.map((n) => renderCard(n)).join('')}
      </div>
      <p class="small text-muted mt-2 mb-0">
        Fonte: Google News - notícia de mercado, não é comunicado oficial. Veja
        <a href="#/comunicados">Comunicados</a> para o texto que a própria empresa publicou.
      </p>
    `;
  }
}

function renderCard(n) {
  return `
    <div class="col">
      <a href="${n.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-reset d-block h-100">
        <div class="card h-100 shadow-sm noticia-card">
          <div class="card-body d-flex flex-column">
            <p class="mb-2 flex-grow-1">${n.titulo}</p>
            <div class="d-flex justify-content-between align-items-center small text-muted">
              <span class="text-truncate">${n.fonte || 'Google News'}</span>
              <span class="ms-2 flex-shrink-0">${formatarData(n.publicadoEm)} ↗</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  `;
}

function formatarData(valor) {
  if (!valor) {
    return '';
  }
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return '';
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

customElements.define('noticias-secao', NoticiasSecao);
