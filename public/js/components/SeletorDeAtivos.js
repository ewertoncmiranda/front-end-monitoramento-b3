import { BaseComponent } from './base/BaseComponent.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import { escaparHtml } from '../utils/html.js';

export class SeletorDeAtivos extends BaseComponent {
  template() {
    const rotulo = this.getAttribute('rotulo-botao') || 'Buscar';
    const placeholder = this.getAttribute('placeholder') || 'Ex.: PETR4';

    return `
      <form id="seletor-form" class="row g-2 align-items-center">
        <div class="col-8 col-sm-9 position-relative">
          <label class="visually-hidden" for="seletor-input">Símbolo ou nome do ativo</label>
          <input id="seletor-input" type="text" class="form-control text-uppercase"
                 placeholder="${placeholder}" autocomplete="off" maxlength="10" required>
          <ul id="seletor-sugestoes" class="dropdown-menu w-100 py-0"
              style="max-height:280px;overflow-y:auto"></ul>
        </div>
        <div class="col-4 col-sm-3">
          <button type="submit" class="btn btn-primary w-100">${escaparHtml(rotulo)}</button>
        </div>
      </form>
    `;
  }

  afterRender() {
    this._ativos = [];
    this._selecionado = null;

    const form = this.querySelector('#seletor-form');
    const input = this.querySelector('#seletor-input');
    const lista = this.querySelector('#seletor-sugestoes');

    const mostrarSugestoes = () => {
      const q = input.value.trim().toUpperCase();
      if (!q || !this._ativos.length) { lista.classList.remove('show'); return; }
      const filtrados = this._ativos
        .filter((a) => a.simbolo.startsWith(q) || (a.nome || '').toUpperCase().includes(q))
        .slice(0, 8);
      if (!filtrados.length) { lista.classList.remove('show'); return; }
      lista.innerHTML = filtrados.map((a) =>
        `<li><button type="button" class="dropdown-item small py-1"
             data-simbolo="${escaparHtml(a.simbolo)}">
           <strong>${escaparHtml(a.simbolo)}</strong>
           ${a.nome ? `<span class="text-muted ms-1">${escaparHtml(a.nome)}</span>` : ''}
         </button></li>`
      ).join('');
      lista.classList.add('show');
    };

    input.addEventListener('input', mostrarSugestoes);
    input.addEventListener('focus', mostrarSugestoes);
    input.addEventListener('blur', () => setTimeout(() => lista.classList.remove('show'), 150));

    lista.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('[data-simbolo]');
      if (!btn) return;
      e.preventDefault();
      input.value = btn.dataset.simbolo;
      lista.classList.remove('show');
      this._emitir(btn.dataset.simbolo);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const simbolo = input.value.trim().toUpperCase();
      if (simbolo) this._emitir(simbolo);
    });

    this._carregarAtivos(input);
  }

  async _carregarAtivos(input) {
    try {
      this._ativos = (await listarAtivosMonitorados()) || [];
    } catch {
      this._ativos = [];
    }

    if (this.hasAttribute('auto-selecionar') && this._ativos.length) {
      this._emitir(this._ativos[0].simbolo);
    }

    // Pré-selecção via atributo value (ex.: link direto ?simbolo=PETR4)
    const val = this.getAttribute('value');
    if (val) { input.value = val.toUpperCase(); this._emitir(val.toUpperCase()); }
  }

  _emitir(simbolo) {
    this._selecionado = simbolo;
    this.dispatchEvent(new CustomEvent('ativo-buscado', { detail: { simbolo }, bubbles: true }));
  }
}

customElements.define('seletor-de-ativos', SeletorDeAtivos);
