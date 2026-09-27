import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarAtivosBase, listarSetoresBase } from '../api/baseAtivosApi.js';
import { registrarAtivo } from '../api/ativosApi.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: a tela "Base" - busca/filtro sobre o universo
// amplo de ativos que o ecossistema conhece (cvm_ticker/cvm_empresa +
// ultimo fechamento oficial do COTAHIST), diferente de Monitorados/
// Favoritos, que so mostra quem o usuario ja escolheu acompanhar.
export class BasePage extends BaseComponent {
  constructor() {
    super();
    this.pagina = 0;
    this.tamanho = 30;
    this.q = '';
    this.setor = '';
    this.pagePayload = null;
  }

  template() {
    return `
      <h4 class="mb-1">Base de ativos</h4>
      <p class="text-muted small">Todo o universo de ativos que o ecossistema conhece (CVM + preço oficial da B3), não só os favoritos. Não usa a BRAPI: o preço aqui é o fechamento oficial mais recente.</p>
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-5">
          <label for="base-busca" class="form-label small mb-1">Buscar</label>
          <input type="search" class="form-control" id="base-busca" placeholder="Símbolo ou nome da empresa">
        </div>
        <div class="col-md-4">
          <label for="base-setor" class="form-label small mb-1">Setor</label>
          <select class="form-select" id="base-setor"><option value="">Todos os setores</option></select>
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-primary w-100" id="base-filtrar">Filtrar</button>
        </div>
      </div>
      <div id="base-resultado"><loading-spinner></loading-spinner></div>
      <div id="base-paginacao" class="d-flex justify-content-between align-items-center mt-3"></div>
    `;
  }

  async afterRender() {
    this.querySelector('#base-filtrar').addEventListener('click', () => {
      this.q = this.querySelector('#base-busca').value.trim();
      this.setor = this.querySelector('#base-setor').value;
      this.pagina = 0;
      this.carregar();
    });
    this.querySelector('#base-busca').addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') this.querySelector('#base-filtrar').click();
    });
    this.onclick = (evento) => {
      const botao = evento.target.closest('[data-favoritar]');
      if (botao) this.favoritar(botao.dataset.favoritar, botao);
      const pagina = evento.target.closest('[data-pagina]');
      if (pagina) { this.pagina = Number(pagina.dataset.pagina); this.carregar(); }
    };

    this.carregarSetores();
    this.carregar();
  }

  async carregarSetores() {
    try {
      const setores = await listarSetoresBase();
      const select = this.querySelector('#base-setor');
      setores.forEach((setor) => {
        const opcao = document.createElement('option');
        opcao.value = setor;
        opcao.textContent = setor;
        select.appendChild(opcao);
      });
    } catch {
      // Filtro de setor e um extra; a busca funciona sem ele.
    }
  }

  async carregar() {
    const resultado = this.querySelector('#base-resultado');
    resultado.innerHTML = '<loading-spinner></loading-spinner>';
    try {
      this.pagePayload = await listarAtivosBase({ q: this.q, setor: this.setor, pagina: this.pagina, tamanho: this.tamanho });
      resultado.innerHTML = this.tabela(this.pagePayload.content || []);
      this.renderPaginacao(this.pagePayload);
    } catch (erro) {
      resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
      this.querySelector('#base-paginacao').innerHTML = '';
    }
  }

  tabela(itens) {
    if (itens.length === 0) {
      return '<p class="text-muted">Nenhum ativo encontrado com esses filtros.</p>';
    }
    const linhas = itens.map((item) => `
      <tr>
        <td class="fw-semibold">${item.simbolo}</td>
        <td>${item.nome ?? '-'}</td>
        <td>${item.setor ?? '-'}</td>
        <td class="text-end">${this.formatarPreco(item.ultimoFechamento)}</td>
        <td class="text-muted small">${item.dataUltimoFechamento ?? '-'}</td>
        <td class="text-center">${item.temFundamento ? '<span class="badge bg-success">Sim</span>' : '<span class="badge bg-secondary">Não</span>'}</td>
        <td class="text-center">
          ${item.favorito
            ? '<span class="badge bg-primary">Favorito</span>'
            : `<button type="button" class="btn btn-sm btn-outline-primary" data-favoritar="${item.simbolo}">+ Favoritos</button>`}
        </td>
      </tr>`).join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle">
          <thead>
            <tr>
              <th>Símbolo</th><th>Empresa</th><th>Setor</th>
              <th class="text-end">Fechamento</th><th>Data</th>
              <th class="text-center">Balanço</th><th class="text-center">Favoritos</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>`;
  }

  formatarPreco(valor) {
    if (valor === null || valor === undefined) return '-';
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  renderPaginacao(payload) {
    const area = this.querySelector('#base-paginacao');
    if (!payload || payload.totalPages <= 1) { area.innerHTML = ''; return; }
    const atual = payload.number;
    area.innerHTML = `
      <button type="button" class="btn btn-outline-secondary btn-sm" data-pagina="${atual - 1}" ${atual === 0 ? 'disabled' : ''}>&laquo; Anterior</button>
      <span class="small text-muted">Página ${atual + 1} de ${payload.totalPages} (${payload.totalElements} ativos)</span>
      <button type="button" class="btn btn-outline-secondary btn-sm" data-pagina="${atual + 1}" ${atual + 1 >= payload.totalPages ? 'disabled' : ''}>Próxima &raquo;</button>
    `;
  }

  async favoritar(simbolo, botao) {
    botao.disabled = true;
    botao.textContent = 'Adicionando…';
    try {
      await registrarAtivo(simbolo);
      botao.outerHTML = '<span class="badge bg-primary">Favorito</span>';
    } catch (erro) {
      botao.disabled = false;
      botao.textContent = '+ Favoritos';
      const celula = botao.closest('td');
      celula.insertAdjacentHTML('beforeend', `<div class="small text-danger mt-1">${erro.message}</div>`);
    }
  }
}

customElements.define('base-page', BasePage);
