import { alternarTema, aplicarTema, rotuloTema, temaAtual } from '../utils/tema.js';

class TemaToggle extends HTMLElement {
  connectedCallback() {
    aplicarTema(temaAtual(), { persistir: false, emitirEvento: false });
    this.render();
    this._aoClicar = () => {
      alternarTema();
    };
    this._aoTema = () => this.render();
    this.addEventListener('click', this._aoClicar);
    window.addEventListener('tema:alterado', this._aoTema);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._aoClicar);
    window.removeEventListener('tema:alterado', this._aoTema);
  }

  render() {
    const compacto = this.getAttribute('modo') === 'bottom';
    const rotulo = rotuloTema();
    const classe = compacto
      ? 'nav-link text-center flex-fill px-1 border-0 bg-transparent'
      : 'btn btn-sm btn-outline-light ms-md-2';
    this.innerHTML = `
      <button type="button" class="${classe}" aria-label="${rotulo.acao}" title="${rotulo.estado}">
        <span aria-hidden="true">${rotulo.icone}</span>
        <small class="${compacto ? 'd-block' : 'ms-1'}">Tema</small>
      </button>
    `;
  }
}

customElements.define('tema-toggle', TemaToggle);
