import { BaseComponent } from './base/BaseComponent.js';
import { listarFavoritos, favoritar, desfavoritar } from '../api/favoritosApi.js';

// Unica responsabilidade: uma estrela que liga/desliga o favorito
// (tipoColeta COTACAO_E_HISTORICO, cotacao intradiaria a cada 15 min) de um
// simbolo, usando os mesmos endpoints /favoritos que a tela de Favoritos.
//
// <favorito-toggle simbolo="PETR4"></favorito-toggle>
//
// Emite `favorito-alterado` (detail: {simbolo, favorito}) depois de
// confirmar a mudanca no backend, pra quem estiver escutando (ex.: a ficha
// do ativo) atualizar o resto da tela sem recarregar tudo.
export class FavoritoToggle extends BaseComponent {
  static get observedAttributes() {
    return ['simbolo'];
  }

  connectedCallback() {
    this._favorito = null; // null = ainda nao sabe
    this._carregando = false;
    super.connectedCallback();
    this.verificarEstadoAtual();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._favorito = null;
      this.renderizar();
      this.verificarEstadoAtual();
    }
  }

  get simbolo() {
    return (this.getAttribute('simbolo') || '').trim().toUpperCase();
  }

  template() {
    return this.marcacao();
  }

  afterRender() {
    this.addEventListener('click', (evento) => {
      const botao = evento.target.closest('[data-favorito-toggle]');
      if (botao) this.alternar();
    });
  }

  /** So consulta a lista de favoritos - nao ha endpoint por simbolo. */
  async verificarEstadoAtual() {
    if (!this.simbolo) return;
    try {
      const favoritos = await listarFavoritos();
      this._favorito = favoritos.some((f) => f.simbolo === this.simbolo);
    } catch {
      this._favorito = false; // sem dado, assume nao-favorito em vez de travar o botao
    }
    this.renderizar();
  }

  async alternar() {
    if (!this.simbolo || this._carregando) return;
    this._carregando = true;
    this.renderizar();

    try {
      if (this._favorito) {
        await desfavoritar(this.simbolo);
        this._favorito = false;
      } else {
        await favoritar(this.simbolo);
        this._favorito = true;
      }
      this.dispatchEvent(new CustomEvent('favorito-alterado', {
        detail: { simbolo: this.simbolo, favorito: this._favorito },
        bubbles: true,
      }));
    } catch {
      // Estado nao mudou; o botao volta a mostrar o que era antes da tentativa.
    } finally {
      this._carregando = false;
      this.renderizar();
    }
  }

  renderizar() {
    this.innerHTML = this.marcacao();
  }

  marcacao() {
    const desconhecido = this._favorito === null;
    const ativo = this._favorito === true;
    const titulo = desconhecido
      ? 'Carregando…'
      : ativo
        ? 'Remover dos favoritos'
        : 'Adicionar aos favoritos';

    return `
      <button type="button" class="btn btn-sm ${ativo ? 'btn-warning' : 'btn-outline-secondary'}"
              data-favorito-toggle
              ${desconhecido || this._carregando ? 'disabled' : ''}
              title="${titulo}" aria-label="${titulo}" aria-pressed="${ativo}">
        ${ativo ? '★' : '☆'}
      </button>
    `;
  }
}

customElements.define('favorito-toggle', FavoritoToggle);
