import { BaseComponent } from '../components/base/BaseComponent.js';
import {
  CATEGORIAS_COMUNICADO,
  buscarComunicadosDoAtivo,
  buscarNewsletter,
  categoriaComunicado,
} from '../api/comunicadosApi.js';
import { formatarData, renderComunicado } from '../components/ComunicadoItem.js';
import { escaparHtml } from '../utils/html.js';
import '../components/SeletorDeAtivos.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a aba de comunicados oficiais da CVM
// (fatos relevantes, proventos, resultados...) - a edicao semanal da carteira
// e a linha do tempo de um ativo. Busca no gestor (infra#CTR-10) e delega o
// desenho de cada documento ao ComunicadoItem.
//
// Aceita link direto: #/comunicados?simbolo=PETR4&semana=2026-W38. O estado
// volta para a URL com history.replaceState, que NAO dispara hashchange - senao
// o roteador remontaria a pagina a cada clique.

const DESTAQUES_POR_EMPRESA = 3;
const TAMANHO_PAGINA = 20;

export class ComunicadosPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Comunicados oficiais</h4>
      <p class="text-muted small">
        Fatos relevantes, comunicados ao mercado, proventos e divulgação de resultados que as
        companhias entregam à CVM, separados por ativo. Cada item leva ao documento oficial;
        o significado de cada categoria está no <a href="#/glossario">Glossário</a>
        (busque por "fato relevante").
      </p>

      <div id="com-filtros" class="d-flex flex-wrap align-items-center gap-2 mb-3"></div>

      <div class="row g-3">
        <section class="col-lg-5" aria-labelledby="com-edicao-titulo">
          <div class="card shadow-sm h-100">
            <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <strong id="com-edicao-titulo">Edição da semana</strong>
              <div id="com-semana-nav" class="btn-group btn-group-sm" role="group" aria-label="Navegar entre semanas"></div>
            </div>
            <div class="card-body">
              <div id="com-edicao"><loading-spinner></loading-spinner></div>
            </div>
          </div>
        </section>

        <section class="col-lg-7" aria-labelledby="com-linha-titulo">
          <div class="card shadow-sm h-100">
            <div class="card-header"><strong id="com-linha-titulo">Linha do tempo do ativo</strong></div>
            <div class="card-body">
              <seletor-de-ativos rotulo-botao="Ver comunicados" placeholder="Ex.: PETR4"></seletor-de-ativos>
              <div id="com-linha" class="mt-3">
                <p class="text-muted small mb-0">
                  Escolha um ativo acima, ou clique numa empresa da edição da semana.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <p id="com-rodape" class="small text-muted mt-3 mb-0"></p>
    `;
  }

  afterRender() {
    const parametros = new URLSearchParams(window.location.hash.split('?')[1] || '');
    this._semana = parametros.get('semana');
    this._simbolo = null;
    this._categorias = new Set(
      CATEGORIAS_COMUNICADO.filter((c) => c.padrao).map((c) => c.valor),
    );
    this._requisicaoEdicao = 0;
    this._requisicaoLinha = 0;

    this.renderizarFiltros();
    this.ligarEventos();
    this.carregarEdicao();

    const simbolo = parametros.get('simbolo');
    if (simbolo) this.selecionarAtivo(simbolo);
  }

  ligarEventos() {
    this.querySelector('seletor-de-ativos').addEventListener('ativo-buscado', (evento) => {
      this.carregarLinhaDoTempo(evento.detail.simbolo);
    });

    this.addEventListener('change', (evento) => {
      const alvo = evento.target.closest('[data-categoria]');
      if (!alvo) return;
      if (alvo.checked) this._categorias.add(alvo.dataset.categoria);
      else this._categorias.delete(alvo.dataset.categoria);
      this.carregarEdicao();
      if (this._simbolo) this.carregarLinhaDoTempo(this._simbolo);
    });

    this.addEventListener('click', (evento) => {
      const semana = evento.target.closest('[data-semana]');
      if (semana) {
        this._semana = semana.dataset.semana;
        this.carregarEdicao();
        return;
      }
      const empresa = evento.target.closest('[data-empresa]');
      if (empresa) {
        this.selecionarAtivo(empresa.dataset.empresa);
        return;
      }
      if (evento.target.closest('[data-mais]')) {
        this.carregarLinhaDoTempo(this._simbolo, this._pagina + 1);
      }
    });
  }

  /** Passa pelo seletor para o chip da carteira ficar marcado, quando existir. */
  selecionarAtivo(simbolo) {
    const seletor = this.querySelector('seletor-de-ativos');
    if (seletor && typeof seletor.selecionar === 'function') {
      seletor.selecionar(simbolo.toUpperCase());
    } else {
      this.carregarLinhaDoTempo(simbolo);
    }
    this.querySelector('#com-linha-titulo').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  renderizarFiltros() {
    this.querySelector('#com-filtros').innerHTML = `
      <span class="small text-muted me-1">Categorias:</span>
      ${CATEGORIAS_COMUNICADO.map(
        (c) => `
          <input type="checkbox" class="btn-check" id="cat-${c.valor}" autocomplete="off"
                 data-categoria="${c.valor}" ${this._categorias.has(c.valor) ? 'checked' : ''}>
          <label class="btn btn-outline-secondary btn-sm" for="cat-${c.valor}">${c.rotulo}</label>`,
      ).join('')}
    `;
  }

  categoriasPedidas() {
    // Ordem fixa: a mesma lista em outra ordem nao pode parecer outro filtro.
    return CATEGORIAS_COMUNICADO.map((c) => c.valor).filter((v) => this._categorias.has(v));
  }

  // --- edicao da semana --------------------------------------------------

  async carregarEdicao() {
    const area = this.querySelector('#com-edicao');
    if (this._categorias.size === 0) {
      area.innerHTML = '<p class="text-muted small mb-0">Marque ao menos uma categoria.</p>';
      this.querySelector('#com-semana-nav').innerHTML = '';
      return;
    }

    const requisicao = ++this._requisicaoEdicao;
    area.innerHTML = '<loading-spinner></loading-spinner>';

    let edicao;
    try {
      edicao = await buscarNewsletter({ semana: this._semana, categorias: this.categoriasPedidas() });
    } catch (erro) {
      if (requisicao !== this._requisicaoEdicao) return;
      area.innerHTML = alerta(erro.message);
      return;
    }
    if (requisicao !== this._requisicaoEdicao) return;

    this._semana = edicao.semana;
    this.atualizarUrl();
    this.renderizarNavegacao(edicao);
    this.renderizarRodape(edicao);
    area.innerHTML = this.templateEdicao(edicao);
  }

  renderizarNavegacao(edicao) {
    const nav = this.querySelector('#com-semana-nav');
    if (!edicao.semana) {
      nav.innerHTML = '';
      return;
    }
    nav.innerHTML = `
      <button type="button" class="btn btn-outline-secondary" data-semana="${edicao.semanaAnterior}"
              aria-label="Semana anterior">‹</button>
      <span class="btn btn-outline-secondary disabled" aria-live="polite">
        ${formatarData(edicao.desde)} – ${formatarData(edicao.ate)}
      </span>
      <button type="button" class="btn btn-outline-secondary" data-semana="${edicao.semanaSeguinte}"
              aria-label="Próxima semana">›</button>
    `;
  }

  templateEdicao(edicao) {
    const aviso = avisoDeDefasagem(edicao);
    if (!edicao.empresas || edicao.empresas.length === 0) {
      return `
        ${aviso}
        <p class="text-muted small mb-0">
          Nenhum documento da carteira nesta semana, nas categorias marcadas.
        </p>`;
    }

    return `
      ${aviso}
      <p class="small text-muted">
        ${edicao.totalDocumentos} documento(s) de ${edicao.empresas.length} empresa(s).
        Empresas com fato relevante aparecem primeiro.
      </p>
      <div class="d-flex flex-column gap-3">
        ${edicao.empresas.map((empresa) => templateEmpresa(empresa)).join('')}
      </div>
    `;
  }

  renderizarRodape(resposta) {
    this.querySelector('#com-rodape').textContent =
      `Fonte: ${resposta.fonte}. ${resposta.aviso}`;
  }

  // --- linha do tempo --------------------------------------------------------

  async carregarLinhaDoTempo(simbolo, pagina = 0) {
    const area = this.querySelector('#com-linha');
    const normalizado = String(simbolo).trim().toUpperCase();
    if (!normalizado) return;

    if (this._categorias.size === 0) {
      area.innerHTML = '<p class="text-muted small mb-0">Marque ao menos uma categoria.</p>';
      return;
    }

    const requisicao = ++this._requisicaoLinha;
    const novaBusca = pagina === 0 || normalizado !== this._simbolo;
    this._simbolo = normalizado;
    this.atualizarUrl();

    if (novaBusca) {
      area.innerHTML = '<loading-spinner></loading-spinner>';
    } else {
      const botao = area.querySelector('[data-mais]');
      if (botao) botao.disabled = true;
    }

    let resposta;
    try {
      resposta = await buscarComunicadosDoAtivo(normalizado, {
        categorias: this.categoriasPedidas(),
        pagina: novaBusca ? 0 : pagina,
        tamanho: TAMANHO_PAGINA,
      });
    } catch (erro) {
      if (requisicao !== this._requisicaoLinha) return;
      area.innerHTML = alerta(erro.message);
      return;
    }
    if (requisicao !== this._requisicaoLinha) return;

    this._pagina = resposta.pagina;
    this.renderizarRodape(resposta);

    if (novaBusca) {
      area.innerHTML = this.templateLinhaDoTempo(resposta);
      return;
    }
    area.querySelector('#com-linha-itens').insertAdjacentHTML(
      'beforeend',
      resposta.comunicados.map((c) => renderComunicado(c)).join(''),
    );
    area.querySelector('#com-linha-mais').innerHTML = botaoMais(resposta);
  }

  templateLinhaDoTempo(resposta) {
    if (resposta.total === 0) {
      return `
        <p class="text-muted small mb-0">
          Nenhum comunicado de <strong>${escaparHtml(resposta.simbolo)}</strong> nas categorias marcadas.
          Se o ativo acabou de entrar na carteira, os comunicados chegam na próxima carga do ETL
          (a carga de fundamentos precisa ter rodado antes, para ligar o ticker ao CNPJ).
        </p>`;
    }
    return `
      <h6 class="mb-1">${escaparHtml(resposta.simbolo)}
        <span class="text-muted fw-normal">— ${resposta.total} documento(s)</span>
      </h6>
      ${resposta.dadosAte ? `<p class="small text-muted mb-2">Dados da CVM até ${formatarData(resposta.dadosAte)}.</p>` : ''}
      <ul id="com-linha-itens" class="list-group list-group-flush">
        ${resposta.comunicados.map((c) => renderComunicado(c)).join('')}
      </ul>
      <div id="com-linha-mais" class="mt-2">${botaoMais(resposta)}</div>
    `;
  }

  atualizarUrl() {
    const parametros = new URLSearchParams();
    if (this._simbolo) parametros.set('simbolo', this._simbolo);
    if (this._semana) parametros.set('semana', this._semana);
    const consulta = parametros.toString();
    history.replaceState(null, '', `#/comunicados${consulta ? `?${consulta}` : ''}`);
  }
}

function templateEmpresa(empresa) {
  const destaques = empresa.comunicados.slice(0, DESTAQUES_POR_EMPRESA);
  const restantes = empresa.total - destaques.length;
  const contagens = Object.entries(empresa.porCategoria || {})
    .map(([categoria, quantidade]) => {
      const c = categoriaComunicado(categoria);
      return `<span class="badge ${c.classe}">${escaparHtml(c.rotulo)} ${quantidade}</span>`;
    })
    .join(' ');

  return `
    <article class="border rounded p-2">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <button type="button" class="btn btn-link p-0 fw-semibold text-decoration-none"
                data-empresa="${escaparHtml(empresa.simbolo)}"
                title="Ver a linha do tempo completa">
          ${escaparHtml(empresa.simbolo)} ›
        </button>
        <span class="d-flex flex-wrap gap-1">${contagens}</span>
      </div>
      <ul class="list-group list-group-flush">
        ${destaques.map((c) => renderComunicado(c)).join('')}
      </ul>
      ${
        restantes > 0
          ? `<button type="button" class="btn btn-sm btn-link px-0" data-empresa="${escaparHtml(empresa.simbolo)}">
               + ${restantes} outro(s) nesta semana — ver linha do tempo
             </button>`
          : ''
      }
    </article>
  `;
}

/**
 * A CVM republica a base ~1x/semana. Semana posterior aos dados disponiveis
 * vazia nao significa "sem noticia": diz isso explicitamente.
 *
 * So dias uteis contam: dado ate sexta cobre a semana, porque entrega no fim
 * de semana e rara. Comparacao por string funciona porque as datas sao ISO.
 */
function avisoDeDefasagem(edicao) {
  const dadosAte = edicao.dadosAte;
  if (!dadosAte) {
    return '<div class="alert alert-secondary small py-2">Nenhum comunicado carregado ainda. Rode a carga <code>--comunicados</code> do ETL.</div>';
  }
  if (edicao.semana && edicao.desde > dadosAte) {
    return `<div class="alert alert-warning small py-2">
      A CVM ainda não publicou os documentos desta semana: os dados vão até
      <strong>${formatarData(dadosAte)}</strong>.</div>`;
  }
  if (edicao.semana && dadosAte < somarDias(edicao.desde, 4)) {
    return `<div class="alert alert-warning small py-2">
      A CVM publicou dados até <strong>${formatarData(dadosAte)}</strong>; o resto da semana
      ainda não entrou.</div>`;
  }
  return `<p class="small text-muted mb-2">Dados da CVM até ${formatarData(dadosAte)}.</p>`;
}

function somarDias(iso, dias) {
  const data = new Date(`${iso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function botaoMais(resposta) {
  if (resposta.pagina + 1 >= resposta.totalPaginas) return '';
  const carregados = Math.min((resposta.pagina + 1) * resposta.tamanho, resposta.total);
  return `
    <button type="button" class="btn btn-outline-secondary btn-sm" data-mais>
      Carregar mais (${carregados} de ${resposta.total})
    </button>`;
}

function alerta(mensagem) {
  return `<status-alert mensagem="${escaparHtml(mensagem)}" variante="danger"></status-alert>`;
}

customElements.define('comunicados-page', ComunicadosPage);
