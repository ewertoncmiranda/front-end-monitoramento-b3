import { BaseComponent } from './base/BaseComponent.js';
import { buscarNaPlataforma } from '../busca/indiceBusca.js';

// Unica responsabilidade: caixa de busca global no cabecalho - encontra
// texto estatico (glossario, padroes, trilhas de estudo) independente da
// tela em que o usuario esta, e navega para a rota certa ao escolher um
// resultado. Nao busca em dado de API (cotacao, insight, comunicado).
export class BuscaGlobal extends BaseComponent {
  connectedCallback() {
    this.aberto = false;
    super.connectedCallback();
  }

  template() {
    return `
      <div class="busca-global position-relative">
        <input type="search" class="form-control form-control-sm" id="busca-global-input"
               placeholder="Buscar no painel…" autocomplete="off"
               aria-label="Buscar no painel" aria-expanded="false" role="combobox">
        <div id="busca-global-resultados"
             class="list-group position-absolute w-100 shadow-sm d-none"
             style="z-index:1050; max-height:60vh; overflow-y:auto; top:100%;"></div>
      </div>
    `;
  }

  afterRender() {
    const input = this.querySelector('#busca-global-input');
    const resultados = this.querySelector('#busca-global-resultados');

    input.addEventListener('input', () => this.pesquisar(input.value));
    input.addEventListener('focus', () => { if (input.value.trim()) this.pesquisar(input.value); });
    input.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') this.fechar();
    });

    resultados.addEventListener('click', (evento) => {
      const item = evento.target.closest('[data-rota]');
      if (!item) return;
      window.location.hash = item.dataset.rota;
      input.value = '';
      this.fechar();
    });

    // Clique fora fecha - o listener fica no documento porque o clique pode
    // acontecer em qualquer outra parte da pagina.
    document.addEventListener('click', (evento) => {
      if (!this.contains(evento.target)) this.fechar();
    });
  }

  pesquisar(texto) {
    const resultados = this.querySelector('#busca-global-resultados');
    const encontrados = buscarNaPlataforma(texto);

    if (!texto.trim() || encontrados.length === 0) {
      resultados.innerHTML = texto.trim()
        ? '<div class="list-group-item small text-muted">Nenhum resultado.</div>'
        : '';
      resultados.classList.toggle('d-none', !texto.trim());
      this.aberto = Boolean(texto.trim());
      return;
    }

    resultados.innerHTML = encontrados.map((item) => `
      <button type="button" class="list-group-item list-group-item-action" data-rota="${item.rota}">
        <div class="d-flex justify-content-between">
          <strong class="small">${item.titulo}</strong>
          <span class="badge bg-light text-dark small">${item.categoria}</span>
        </div>
        ${item.trecho ? `<div class="small text-muted text-truncate">${item.trecho}</div>` : ''}
      </button>
    `).join('');
    resultados.classList.remove('d-none');
    this.aberto = true;
  }

  fechar() {
    this.aberto = false;
    const resultados = this.querySelector('#busca-global-resultados');
    if (resultados) resultados.classList.add('d-none');
  }
}

customElements.define('busca-global', BuscaGlobal);
