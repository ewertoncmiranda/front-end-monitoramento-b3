import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarAtivosPainel, listarSetoresBase } from '../api/baseAtivosApi.js';
import { desfavoritar, favoritar } from '../api/favoritosApi.js';
import { hashDaBase, lerFiltrosBase } from '../analise/filtrosBase.js';
import { filtrosDaVisao, htmlTabelaAtivos } from '../analise/listagemAtivos.js';
import { escaparHtml } from '../utils/html.js';
import { htmlSelo } from '../utils/selos.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

const CHIPS = [
  { visao: 'todos', rotulo: 'Todos' },
  { visao: 'favoritos', rotulo: 'Favoritos' },
  { visao: 'monitorados', rotulo: 'Monitorados' },
];

const DESCRICAO = {
  todos: 'Todo o universo que o ecossistema conhece (CVM + preço oficial da B3). Escolha um setor no filtro para comparar papéis.',
  favoritos: 'Favoritos recebem cotação intradiária via BRAPI no pregão (mínimo 15 min, 10h05 às 17h35); fora dele vale o último preço oficial. Remover pausa essa coleta.',
  monitorados: 'Todo ativo cadastrado no monitoramento: favoritos (BRAPI no pregão) e referências diárias (preço oficial da B3, COTAHIST).',
};

// Unica responsabilidade: a tabela unica de ativos (REQ-UX-8 / TASK-UX-6).
// Base, Favoritos, Monitorados e Setores viraram chips e filtros desta mesma
// tela; os filtros viajam no link (#/ativos?visao=&q=&setor=&pagina=) e as
// rotas antigas (#/base, #/favoritos, #/monitorados, #/setores) abrem aqui
// na visao correspondente. Uma chamada por pagina (GET /painel/ativos): a
// linha ja traz preco oficial, variacao, sparkline, sinal e ultimo comunicado.
export class AtivosPage extends BaseComponent {
  constructor() {
    super();
    this.tamanho = 30;
    Object.assign(this, lerFiltrosBase(window.location.hash));
    this.pagePayload = null;
  }

  template() {
    const chips = CHIPS.map((c) => `
      <button type="button" class="btn btn-sm ${c.visao === this.visao ? 'btn-primary' : 'btn-outline-primary'}"
        data-visao="${c.visao}" aria-pressed="${c.visao === this.visao}">${c.rotulo}</button>`).join('');
    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h4 class="mb-0">Ativos</h4>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btn-atualizar">Atualizar</button>
      </div>
      <p class="text-muted small" id="ativos-descricao">${DESCRICAO[this.visao]}</p>
      <div class="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar por lista">${chips}</div>
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-5">
          <label for="ativos-busca" class="form-label small mb-1">Buscar</label>
          <input type="search" class="form-control" id="ativos-busca" placeholder="Símbolo ou nome da empresa">
        </div>
        <div class="col-md-4">
          <label for="ativos-setor" class="form-label small mb-1">Setor</label>
          <select class="form-select" id="ativos-setor"><option value="">Todos os setores</option></select>
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-primary w-100" id="ativos-filtrar">Filtrar</button>
        </div>
      </div>
      <div id="ativos-resultado"><loading-spinner></loading-spinner></div>
      <div id="ativos-paginacao" class="d-flex justify-content-between align-items-center mt-3"></div>
      <p class="small text-muted mt-3 mb-0">Sinal = última leitura das regras do ecossistema, ${htmlSelo('EXPERIMENTAL', 'regra experimental')}: não é recomendação de investimento.</p>
    `;
  }

  async afterRender() {
    this.querySelector('#ativos-busca').value = this.q;
    this.querySelector('#btn-atualizar').addEventListener('click', () => this.carregar());
    this.querySelector('#ativos-filtrar').addEventListener('click', () => {
      this.q = this.querySelector('#ativos-busca').value.trim();
      this.setor = this.querySelector('#ativos-setor').value;
      this.pagina = 0;
      this.carregar();
    });
    this.querySelector('#ativos-busca').addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') this.querySelector('#ativos-filtrar').click();
    });
    this.onclick = (evento) => {
      const chip = evento.target.closest('[data-visao]');
      if (chip) { this.trocarVisao(chip.dataset.visao); return; }
      const favoritarBotao = evento.target.closest('[data-favoritar]');
      if (favoritarBotao) { this.alterarFavorito(favoritarBotao, favoritarBotao.dataset.favoritar, true); return; }
      const removerBotao = evento.target.closest('[data-remover-favorito]');
      if (removerBotao) { this.alterarFavorito(removerBotao, removerBotao.dataset.removerFavorito, false); return; }
      const pagina = evento.target.closest('[data-pagina]');
      if (pagina) { this.pagina = Number(pagina.dataset.pagina); this.carregar(); }
    };

    this.carregarSetores();
    this.carregar();
  }

  trocarVisao(visao) {
    this.visao = visao;
    this.pagina = 0;
    this.querySelectorAll('[data-visao]').forEach((chip) => {
      const ativo = chip.dataset.visao === visao;
      chip.classList.toggle('btn-primary', ativo);
      chip.classList.toggle('btn-outline-primary', !ativo);
      chip.setAttribute('aria-pressed', String(ativo));
    });
    this.querySelector('#ativos-descricao').textContent = DESCRICAO[visao];
    this.carregar();
  }

  async carregarSetores() {
    try {
      const setores = await listarSetoresBase();
      const select = this.querySelector('#ativos-setor');
      setores.forEach((setor) => {
        const opcao = document.createElement('option');
        opcao.value = setor;
        opcao.textContent = setor;
        select.appendChild(opcao);
      });
      select.value = this.setor;
    } catch {
      // Filtro de setor e um extra; a busca funciona sem ele.
    }
  }

  async carregar() {
    const resultado = this.querySelector('#ativos-resultado');
    resultado.innerHTML = '<loading-spinner></loading-spinner>';
    try {
      history.replaceState(null, '', hashDaBase({ visao: this.visao, q: this.q, setor: this.setor, pagina: this.pagina }));
    } catch { /* sem History API: o link so nao acompanha */ }
    try {
      this.pagePayload = await listarAtivosPainel({
        q: this.q,
        setor: this.setor,
        pagina: this.pagina,
        tamanho: this.tamanho,
        ...filtrosDaVisao(this.visao),
      });
      resultado.innerHTML = htmlTabelaAtivos(this.pagePayload.content || [], { visao: this.visao });
      this.renderPaginacao(this.pagePayload);
    } catch (erro) {
      resultado.innerHTML = `<status-alert mensagem="${escaparHtml(erro.message)}" variante="danger"></status-alert>`;
      this.querySelector('#ativos-paginacao').innerHTML = '';
    }
  }

  renderPaginacao(payload) {
    const area = this.querySelector('#ativos-paginacao');
    if (!payload || payload.totalPages <= 1) { area.innerHTML = ''; return; }
    const atual = payload.number;
    area.innerHTML = `
      <button type="button" class="btn btn-outline-secondary btn-sm" data-pagina="${atual - 1}" ${atual === 0 ? 'disabled' : ''}>&laquo; Anterior</button>
      <span class="small text-muted">Página ${atual + 1} de ${payload.totalPages} (${payload.totalElements} ativos)</span>
      <button type="button" class="btn btn-outline-secondary btn-sm" data-pagina="${atual + 1}" ${atual + 1 >= payload.totalPages ? 'disabled' : ''}>Próxima &raquo;</button>
    `;
  }

  // Favoritar ou remover recarrega a pagina: selos, acao e (na visao de
  // favoritos) a propria lista mudam juntos.
  async alterarFavorito(botao, simbolo, tornarFavorito) {
    const rotuloOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = tornarFavorito ? 'Adicionando…' : 'Removendo…';
    try {
      await (tornarFavorito ? favoritar(simbolo) : desfavoritar(simbolo));
      this.carregar();
    } catch (erro) {
      botao.disabled = false;
      botao.textContent = rotuloOriginal;
      botao.closest('td').insertAdjacentHTML('beforeend', `<div class="small text-danger mt-1">${escaparHtml(erro.message)}</div>`);
    }
  }
}

customElements.define('ativos-page', AtivosPage);
