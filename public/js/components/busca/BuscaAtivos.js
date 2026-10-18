import { BaseComponent } from '../base/BaseComponent.js';
import { listarAtivosPainel, listarSetoresBase } from '../../api/baseAtivosApi.js';
import { buscarFiltrosOperacionais, buscarTickers } from '../../api/operacionalV2Api.js';
import {
  alternarSelecao, combinarListagem, estadoVazio, lerSimbolos, normalizarEstado,
  parametrosBase, parametrosOperacionais, removerSelecao, temCriterio,
} from '../../analise/buscaAtivos.js';
import { escaparHtml } from '../../utils/html.js';
import { htmlFiltroAtivos } from './filtroAtivos.js';
import { ESTILO_BUSCA_ATIVOS, htmlCartoesAtivos, htmlTickersSelecionados } from './cartoesAtivos.js';

// Setores e opcoes operacionais mudam pouco: uma busca por pagina carregada,
// compartilhada por todas as instancias (ha uma por carteira).
let setoresDaSessao = null;
let opcoesDaSessao = null;
const setores = () => (setoresDaSessao ??= listarSetoresBase().catch(() => { setoresDaSessao = null; return []; }));
const opcoesOperacionais = () => (opcoesDaSessao ??= buscarFiltrosOperacionais()
  .then((o) => (o?.indisponivel ? {} : o)).catch(() => { opcoesDaSessao = null; return {}; }));

let instancias = 0;

function armazenamento() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function injetarEstilo() {
  if (typeof document === 'undefined' || document.getElementById('busca-ativos-estilo')) return;
  const estilo = document.createElement('style');
  estilo.id = 'busca-ativos-estilo';
  estilo.textContent = ESTILO_BUSCA_ATIVOS;
  document.head.appendChild(estilo);
}

/**
 * Busca reutilizavel de ativos: barra (Buscar, Setor, UF), filtros
 * operacionais, resultados em cartoes flutuantes e tickers escolhidos.
 *
 * Atributos:
 *   modo="unico|multiplo"  um ticker (formularios) ou varios (lista do simulador)
 *   chave="..."            guarda filtros, resultados e selecao na sessao;
 *                          a pagina pode se redesenhar inteira sem perder a busca
 *   valor="PETR4,VALE3"    selecao vinda da pagina (vence a guardada)
 *   campo="id-do-input"    no modo unico, o input do formulario a preencher
 *   acoes="consultar"      botoes extras em cada cartao
 *
 * Eventos (bubbles): busca-ativos:selecao { simbolos, simbolo, selecionado }
 *                    busca-ativos:acao    { acao, simbolo }
 */
export class BuscaAtivos extends BaseComponent {
  static get observedAttributes() {
    return ['chave', 'valor'];
  }

  constructor() {
    super();
    this._prefixo = `ba${++instancias}`;
    this._estado = estadoVazio();
    this._resultado = null;
    this._selecionados = [];
    this._carregando = false;
    this._erro = '';
  }

  get modo() {
    return this.getAttribute('modo') === 'multiplo' ? 'multiplo' : 'unico';
  }

  get acoes() {
    return String(this.getAttribute('acoes') || '').split(',').map((a) => a.trim()).filter(Boolean);
  }

  get simbolos() {
    return [...this._selecionados];
  }

  connectedCallback() {
    injetarEstilo();
    this.restaurar();
    super.connectedCallback();
    // A pagina pode ter redesenhado o formulario: o input oculto volta vazio.
    queueMicrotask(() => this.preencherCampo());
    this.carregarOpcoes();
  }

  attributeChangedCallback(nome, antes, depois) {
    if (antes === depois || !this.isConnected) return;
    if (nome === 'chave') this.restaurar();
    if (nome === 'valor') this._selecionados = lerSimbolos(depois);
    this.desenhar();
  }

  // --- estado ---------------------------------------------------------------------------

  get _chaveArmazenada() {
    const chave = this.getAttribute('chave');
    return chave ? `busca-ativos:${chave}` : null;
  }

  restaurar() {
    const chave = this._chaveArmazenada;
    let salvo = null;
    try {
      salvo = chave ? JSON.parse(armazenamento()?.getItem(chave) || 'null') : null;
    } catch {
      salvo = null;
    }
    this._estado = normalizarEstado(salvo?.estado);
    this._resultado = salvo?.resultado ?? null;
    this._selecionados = this.hasAttribute('valor')
      ? lerSimbolos(this.getAttribute('valor'))
      : lerSimbolos((salvo?.selecionados || []).join(','));
  }

  guardar() {
    const chave = this._chaveArmazenada;
    if (!chave) return;
    try {
      armazenamento()?.setItem(chave, JSON.stringify({
        estado: this._estado, resultado: this._resultado, selecionados: this._selecionados,
      }));
    } catch {
      // Sem armazenamento (aba anonima, cota cheia): a busca so nao sobrevive ao redesenho.
    }
  }

  // --- desenho --------------------------------------------------------------------------

  template() {
    return `
      ${htmlTickersSelecionados(this._selecionados, { modo: this.modo })}
      <div data-ba-filtro>${htmlFiltroAtivos(this._estado, { setores: this._setores || [], opcoesOperacionais: this._opcoes || {}, prefixo: this._prefixo })}</div>
      <div data-ba-resultado aria-live="polite">${this.htmlResultado()}</div>`;
  }

  htmlResultado() {
    if (this._carregando) return '<div class="small text-body-secondary py-2"><span class="spinner-border spinner-border-sm"></span> Buscando…</div>';
    if (this._erro) return `<div class="alert alert-danger small py-2 mb-0">${escaparHtml(this._erro)}</div>`;
    if (!this._resultado) return '<p class="small text-body-secondary mb-0">Digite um símbolo ou nome, ou escolha um setor, e clique em Filtrar.</p>';
    const { itens = [], totalItens = 0, totalPaginas = 1 } = this._resultado;
    if (!itens.length) return '<p class="small text-body-secondary mb-0">Nenhum ativo bate com esses filtros.</p>';
    const temMais = this._estado.pagina + 1 < totalPaginas;
    return `
      <p class="small text-body-secondary mb-2">${itens.length} de ${totalItens} ativo(s)</p>
      ${htmlCartoesAtivos(itens, { selecionados: this._selecionados, modo: this.modo, acoes: this.acoes })}
      ${temMais ? '<div class="text-center mt-2"><button type="button" class="btn btn-sm btn-outline-secondary" data-ba-mais>Carregar mais</button></div>' : ''}`;
  }

  desenhar() {
    if (!this.isConnected) return;
    this.innerHTML = this.template();
  }

  desenharResultado() {
    const alvo = this.querySelector('[data-ba-resultado]');
    if (alvo) alvo.innerHTML = this.htmlResultado();
  }

  desenharTickers() {
    const alvo = this.querySelector('[data-ba-tickers]');
    if (alvo) alvo.outerHTML = htmlTickersSelecionados(this._selecionados, { modo: this.modo });
  }

  afterRender() {
    if (this._ligado) return;
    this._ligado = true;
    this.addEventListener('click', (e) => this.aoClicar(e));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.closest('[data-ba-campo]')) {
        e.preventDefault();
        this.filtrar();
      }
    });
    this.addEventListener('change', (e) => {
      if (e.target.closest('[data-filtro-operacional]') || e.target.closest('[data-ba-campo="setor"]')) this.filtrar();
    });
  }

  async carregarOpcoes() {
    const [lista, opcoes] = await Promise.all([setores(), opcoesOperacionais()]);
    if (!this.isConnected) return;
    this._setores = lista;
    this._opcoes = opcoes;
    const alvo = this.querySelector('[data-ba-filtro]');
    if (alvo) alvo.innerHTML = htmlFiltroAtivos(this._estado, { setores: lista, opcoesOperacionais: opcoes, prefixo: this._prefixo });
  }

  // --- interacao ------------------------------------------------------------------------

  aoClicar(e) {
    const alvo = e.target;
    if (alvo.closest('[data-ba-filtrar]')) return this.filtrar();
    if (alvo.closest('[data-ba-mais]')) return this.buscar({ acrescentar: true });
    if (alvo.closest('[data-limpar-filtros-operacionais]')) return this.limparOperacionais();
    const escolher = alvo.closest('[data-ba-escolher]');
    if (escolher) return this.escolher(escolher.dataset.baEscolher);
    const remover = alvo.closest('[data-ba-remover]');
    if (remover) return this.escolher(remover.dataset.baRemover, { remover: true });
    const acao = alvo.closest('[data-ba-acao]');
    if (acao) {
      this.dispatchEvent(new CustomEvent('busca-ativos:acao', {
        detail: { acao: acao.dataset.baAcao, simbolo: acao.dataset.baSimbolo }, bubbles: true,
      }));
    }
    return undefined;
  }

  lerFormulario() {
    const valor = (campo) => this.querySelector(`[data-ba-campo="${campo}"]`)?.value ?? '';
    const operacionais = {};
    this.querySelectorAll('[data-filtro-operacional]').forEach((s) => { operacionais[s.dataset.filtroOperacional] = s.value; });
    return normalizarEstado({ q: valor('q'), setor: valor('setor'), uf: valor('uf'), pagina: 0, ...operacionais });
  }

  filtrar() {
    this._estado = this.lerFormulario();
    if (!temCriterio(this._estado)) {
      this._resultado = null;
      this.guardar();
      this.desenharResultado();
      return Promise.resolve();
    }
    return this.buscar();
  }

  limparOperacionais() {
    const atual = this.lerFormulario();
    this._estado = normalizarEstado({ q: atual.q, setor: atual.setor, uf: atual.uf });
    this.carregarOpcoes();
    return this.filtrar();
  }

  async buscar({ acrescentar = false } = {}) {
    const estado = { ...this._estado, pagina: acrescentar ? this._estado.pagina + 1 : 0 };
    const anteriores = acrescentar ? (this._resultado?.itens || []) : [];
    this._carregando = true;
    this._erro = '';
    this.desenharResultado();
    try {
      const [base, operacionais] = await Promise.all([
        listarAtivosPainel(parametrosBase(estado)),
        buscarTickers(parametrosOperacionais(estado)).catch(() => ({ indisponivel: true })),
      ]);
      const pagina = combinarListagem(base, operacionais, estado);
      this._estado = estado;
      this._resultado = { ...pagina, itens: [...anteriores, ...pagina.itens] };
    } catch (erro) {
      this._erro = erro?.message || 'Não foi possível buscar os ativos.';
    } finally {
      this._carregando = false;
      this.guardar();
      this.desenharResultado();
    }
  }

  escolher(simbolo, { remover = false } = {}) {
    const antes = this._selecionados;
    this._selecionados = remover ? removerSelecao(antes, simbolo) : alternarSelecao(antes, simbolo, this.modo);
    const s = String(simbolo).toUpperCase();
    const selecionado = this._selecionados.includes(s);
    this.guardar();
    this.preencherCampo();
    this.desenharTickers();
    this.desenharResultado();
    this.dispatchEvent(new CustomEvent('busca-ativos:selecao', {
      detail: { simbolos: this.simbolos, simbolo: s, selecionado }, bubbles: true,
    }));
  }

  /** Modo unico: espelha o ticker no input do formulario da pagina (atributo campo). */
  preencherCampo() {
    const id = this.getAttribute('campo');
    if (!id || this.modo !== 'unico') return;
    const input = document.getElementById(id);
    if (!input) return;
    input.value = this._selecionados[0] || '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Limpa a selecao sem emitir evento (ex.: depois de salvar um formulario). */
  limpar() {
    this._selecionados = [];
    this.guardar();
    this.preencherCampo();
    this.desenharTickers();
    this.desenharResultado();
  }
}

customElements.define('busca-ativos', BuscaAtivos);
