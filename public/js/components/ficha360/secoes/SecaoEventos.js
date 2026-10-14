import { BaseComponent } from '../../base/BaseComponent.js';
import { montarLinhaDoTempo, filtrarPorTipo } from '../../../analise/ficha360/linhaDoTempo.js';
import { escaparHtml } from '../../../utils/html.js';

/**
 * F360-PAI-9: Seção Eventos - linha do tempo única
 * Junta comunicados CVM e notícias em ordem decrescente, com filtro por tipo.
 * Clicar num item emite f360:destacar-data.
 */
export class SecaoEventos extends BaseComponent {
  constructor() {
    super();
    this.contexto = null;
    this.eventos = [];
    this.filtroTipo = 'todos';
    this.carregando = false;
    this.erro = null;
  }

  set contexto(ctx) {
    this._contexto = ctx;
    this.carregarEventos();
  }

  get contexto() {
    return this._contexto;
  }

  async carregarEventos() {
    if (!this.contexto) return;
    
    this.carregando = true;
    this.erro = null;
    this.render();

    try {
      const [comunicados, noticias] = await Promise.all([
        this.contexto.obter('comunicados'),
        this.contexto.obter('noticias'),
      ]);

      this.eventos = montarLinhaDoTempo({
        comunicados: comunicados?.comunicados || [],
        noticias: noticias || [],
      });
    } catch (e) {
      console.error('Erro ao carregar eventos:', e);
      this.erro = e.message || 'Erro ao carregar eventos';
    } finally {
      this.carregando = false;
      this.render();
    }
  }

  template() {
    if (this.carregando) {
      return `
        <div class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span class="ms-2 text-muted">Carregando eventos...</span>
        </div>
      `;
    }

    if (this.erro) {
      return `
        <div class="alert alert-danger">
          ${escaparHtml(this.erro)}
        </div>
      `;
    }

    if (!this.eventos.length) {
      return `
        <div class="text-center py-4 text-muted">
          Nenhum evento no período
        </div>
      `;
    }

    const eventosFiltrados = filtrarPorTipo(this.eventos, this.filtroTipo);

    return `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">Linha do tempo</h6>
        <select class="form-select form-select-sm" style="width: auto;" id="filtro-tipo">
          <option value="todos" ${this.filtroTipo === 'todos' ? 'selected' : ''}>Todos</option>
          <option value="comunicado" ${this.filtroTipo === 'comunicado' ? 'selected' : ''}>Comunicados</option>
          <option value="noticia" ${this.filtroTipo === 'noticia' ? 'selected' : ''}>Notícias</option>
        </select>
      </div>
      <div class="timeline">
        ${eventosFiltrados.map((e) => this.renderEvento(e)).join('')}
      </div>
    `;
  }

  renderEvento(evento) {
    const { tipo, dataIso, titulo, categoria, icone, conteudo } = evento;
    const dataFormatada = new Date(dataIso).toLocaleDateString('pt-BR');

    return `
      <div class="timeline-item mb-3 p-3 border rounded" style="background-color: var(--f360-superficie-2); cursor: pointer;" data-data-iso="${escaparHtml(dataIso)}">
        <div class="d-flex align-items-start gap-2">
          <span class="fs-5">${icone}</span>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted">${dataFormatada}</small>
              <span class="badge bg-secondary">${escaparHtml(categoria)}</span>
            </div>
            <p class="mb-1 fw-semibold">${escaparHtml(titulo)}</p>
            ${tipo === 'comunicado' && conteudo?.link ? `
              <a href="${escaparHtml(conteudo.link)}" target="_blank" rel="noopener noreferrer" class="small text-primary">
                Ver documento oficial ↗
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    // Filtro por tipo
    this.querySelector('#filtro-tipo')?.addEventListener('change', (e) => {
      this.filtroTipo = e.target.value;
      this.render();
    });

    // Clique em evento - emitir f360:destacar-data
    this.querySelectorAll('[data-data-iso]').forEach((item) => {
      item.addEventListener('click', () => {
        const dataIso = item.dataset.dataIso;
        document.dispatchEvent(new CustomEvent('f360:destacar-data', {
          detail: {
            simbolo: this.contexto?.simbolo,
            dataIso,
          },
        }));
      });
    });
  }
}

customElements.define('secao-eventos', SecaoEventos);
