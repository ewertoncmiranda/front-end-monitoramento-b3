import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import { buscarNoticias } from '../api/noticiasApi.js';
import '../components/NoticiasSecao.js';

// Unica responsabilidade: orquestrar a tela "Noticias por ativo" - baloes
// (chips) com os ativos ja monitorados, mais uma busca livre pra qualquer
// ticker da B3, mesmo fora do monitoramento. Clicar num balao ou buscar
// troca qual ticker o NoticiasSecao mostra - nunca os dois ao mesmo tempo.
export class NoticiasPage extends BaseComponent {
  constructor() {
    super();
    this._ativos = [];
    this._simboloAtual = null;
  }

  template() {
    return `
      <h4 class="mb-1">Notícias por ativo</h4>
      <p class="text-muted small">
        Manchetes de mercado (Google News) por ticker. Clique num dos seus ativos monitorados
        ou busque qualquer outro papel da B3, mesmo que ainda não esteja cadastrado.
      </p>

      <form id="noticias-busca-form" class="row g-2 mb-3" role="search">
        <div class="col-sm-8 col-md-6">
          <label for="noticias-busca-input" class="visually-hidden">Buscar ticker</label>
          <input type="search" class="form-control" id="noticias-busca-input"
                 placeholder="Buscar outro ticker (ex.: VALE3, MGLU3...)" autocomplete="off">
        </div>
        <div class="col-auto">
          <button type="submit" class="btn btn-primary">Buscar</button>
        </div>
      </form>

      <div id="noticias-chips" class="d-flex flex-wrap gap-2 mb-4"></div>

      <div id="noticias-titulo-atual" class="mb-3"></div>
      <noticias-secao id="noticias-conteudo"></noticias-secao>
    `;
  }

  afterRender() {
    this.querySelector('#noticias-busca-form').addEventListener('submit', (evento) => {
      evento.preventDefault();
      const campo = this.querySelector('#noticias-busca-input');
      const simbolo = campo.value.trim().toUpperCase();
      if (!simbolo) {
        return;
      }
      campo.value = '';
      this.selecionarSimbolo(simbolo);
    });

    this.addEventListener('click', (evento) => {
      const chip = evento.target.closest('[data-simbolo]');
      if (chip) {
        this.selecionarSimbolo(chip.dataset.simbolo);
      }
    });

    this.carregarAtivosMonitorados();
  }

  async carregarAtivosMonitorados() {
    try {
      this._ativos = await listarAtivosMonitorados();
    } catch {
      this._ativos = [];
    }
    this.renderizarChips();

    // Primeira visita: adianta mostrando noticias do primeiro monitorado,
    // em vez de deixar a tela vazia esperando o usuario escolher.
    if (!this._simboloAtual && this._ativos.length) {
      this.selecionarSimbolo(this._ativos[0].simbolo);
    }
  }

  renderizarChips() {
    const area = this.querySelector('#noticias-chips');
    if (!this._ativos.length) {
      area.innerHTML = '<p class="text-muted small mb-0">Nenhum ativo monitorado ainda - use a busca acima.</p>';
      return;
    }
    area.innerHTML = this._ativos
      .map((a) => {
        const ativo = a.simbolo === this._simboloAtual;
        return `
          <button type="button" class="btn btn-sm rounded-pill ${ativo ? 'btn-primary' : 'btn-outline-primary'}" data-simbolo="${a.simbolo}">
            ${a.simbolo}
          </button>
        `;
      })
      .join('');
  }

  async selecionarSimbolo(simbolo) {
    this._simboloAtual = simbolo;
    this.renderizarChips();
    this.querySelector('#noticias-titulo-atual').innerHTML =
      `<h5 class="mb-0">Notícias de <span class="text-primary">${simbolo}</span></h5>`;

    const secao = this.querySelector('#noticias-conteudo');
    secao.setCarregando();
    try {
      const noticias = await buscarNoticias(simbolo);
      secao.setNoticias(noticias);
    } catch {
      secao.setErro();
    }
  }
}

customElements.define('noticias-page', NoticiasPage);
