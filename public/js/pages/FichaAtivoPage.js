import { BaseComponent } from '../components/base/BaseComponent.js';
import { FichaContexto } from '../components/ficha360/FichaContexto.js';
import { SECOES, carregarSecao, tagDaSecao } from '../components/ficha360/manifesto.js';
import { guardarUltimo, hashDaFicha, lerUltimo, rotaDaFicha } from '../components/ficha360/rotaFicha.js';
import { esqueleto } from '../components/ficha/esqueleto.js';
import { escaparHtml } from '../utils/html.js';
import '../components/SeletorDeAtivos.js';

export function htmlEmConstrucao(rotulo) {
  return `<div class="f360-em-construcao text-body-secondary small border rounded p-3" role="status">
    Seção ${escaparHtml(rotulo)} em construção.</div>`;
}

export function htmlNavegacao(simbolo) {
  return SECOES.filter((s) => s.ancora).map((s) => `
    <a class="btn btn-sm btn-outline-secondary f360-nav-item" data-ir-para="${s.id}"
       href="${hashDaFicha(simbolo, s.id)}">${escaparHtml(s.rotulo)}</a>`).join('');
}

export function htmlEstrutura(simbolo) {
  const corpo = SECOES.filter((s) => s.id !== 'cabecalho').map((s) => `
    <section id="f360-secao-${s.id}" class="f360-secao" data-secao-id="${s.id}" aria-labelledby="f360-titulo-${s.id}">
      <h2 id="f360-titulo-${s.id}" class="f360-titulo">${escaparHtml(s.rotulo)}</h2>
      <div data-secao-corpo>${esqueleto(3)}</div>
    </section>`).join('');
  return `
    <div class="f360">
      <div class="f360-topo">
        <div data-secao-id="cabecalho"><div data-secao-corpo>${esqueleto(2)}</div></div>
        <nav class="f360-nav" aria-label="Seções da ficha de ${escaparHtml(simbolo)}">${htmlNavegacao(simbolo)}</nav>
      </div>
      ${corpo}
    </div>`;
}

export function htmlSemAtivo(ultimo) {
  return `
    <h4 class="mb-1">Ficha do ativo</h4>
    <p class="text-body-secondary small">Escolha um ativo para ver tudo sobre ele numa página só.</p>
    <seletor-de-ativos rotulo-botao="Abrir ficha" placeholder="Ex.: PETR4"></seletor-de-ativos>
    <p class="small mt-3 mb-0">
      ${ultimo ? `Último visto: <a href="${hashDaFicha(ultimo)}">${escaparHtml(ultimo)}</a> · ` : ''}
      <a href="#/ativos">Tabela de ativos</a>
    </p>`;
}

const ESTILO = `
  <style>
    .f360 { background: var(--f360-superficie, var(--bs-body-bg)); border-radius: 12px; padding: 0 1rem 1.5rem; }
    .f360-topo { position: sticky; top: 0; z-index: 1010; background: var(--f360-superficie, var(--bs-body-bg));
      border-bottom: 1px solid var(--bs-border-color); padding: .5rem 0; }
    .f360-nav { display: flex; gap: .25rem; overflow-x: auto; scrollbar-width: thin; padding-top: .5rem; }
    .f360-nav-item { white-space: nowrap; }
    .f360-nav-item.active { background: var(--bs-secondary); color: var(--bs-white); }
    .f360-secao { margin-top: 1.5rem; scroll-margin-top: calc(var(--f360-topo-altura, 8rem) + .5rem); }
    .f360-titulo { font-size: .8rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
      color: var(--f360-texto-mudo, var(--bs-secondary-color)); margin-bottom: .5rem; }
  </style>`;

// Unica responsabilidade: montar a ficha de um ativo - cria o contexto de
// dados, carrega cada secao do manifesto sob demanda e cuida da navegacao
// entre elas. Nao desenha dado nenhum: isso e de cada secao.
export class FichaAtivoPage extends BaseComponent {
  template() {
    const { simbolo } = rotaDaFicha(window.location.hash);
    this._simbolo = simbolo;
    return ESTILO + (simbolo ? htmlEstrutura(simbolo) : htmlSemAtivo(lerUltimo()));
  }

  afterRender() {
    if (!this._simbolo) {
      this.querySelector('seletor-de-ativos')?.addEventListener('ativo-buscado', (e) => {
        window.location.hash = hashDaFicha(e.detail.simbolo);
      });
      return;
    }
    guardarUltimo(this._simbolo);
    this._contexto = new FichaContexto(this._simbolo);
    this.ligarNavegacao();
    this.medirTopo();
    SECOES.forEach((s) => this.montarSecao(s));
    const { secao } = rotaDaFicha(window.location.hash);
    if (secao) this.fixarAncora(secao);
  }

  disconnectedCallback() {
    document.removeEventListener('f360:ir-para', this._aoIrPara);
    window.removeEventListener('scroll', this._aoRolar);
    this._observadorTopo?.disconnect();
    this._soltarAncora?.();
  }

  /**
   * Link com ?secao=: as secoes acima ainda estao carregando e crescem, o que
   * empurraria o alvo para baixo. Realinha a cada mudanca de altura por ate
   * 4 s, ou ate o usuario rolar por conta propria.
   */
  fixarAncora(secao) {
    const alvo = this.querySelector(`#f360-secao-${secao}`);
    if (!alvo) return;
    // 'instant': o Bootstrap liga scroll-behavior smooth no :root, e cada
    // realinhamento reiniciaria a animacao.
    const alinhar = () => alvo.scrollIntoView({ block: 'start', behavior: 'instant' });
    const eventos = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const observador = typeof ResizeObserver === 'function' ? new ResizeObserver(alinhar) : null;
    const timer = setTimeout(() => this._soltarAncora?.(), 4000);
    this._soltarAncora = () => {
      observador?.disconnect();
      clearTimeout(timer);
      eventos.forEach((ev) => window.removeEventListener(ev, this._soltarAncora));
      this._soltarAncora = null;
    };
    eventos.forEach((ev) => window.addEventListener(ev, this._soltarAncora, { once: true, passive: true }));
    observador?.observe(this.querySelector('.f360'));
    this._pedida = secao;
    alinhar();
    this.marcarAtiva(secao);
  }

  async montarSecao({ id, rotulo }) {
    const corpo = this.querySelector(`[data-secao-id="${id}"] [data-secao-corpo]`);
    const existe = await carregarSecao(id);
    if (!corpo?.isConnected) return;
    if (!existe) {
      corpo.innerHTML = htmlEmConstrucao(rotulo);
      return;
    }
    const elemento = document.createElement(tagDaSecao(id));
    corpo.replaceChildren(elemento);
    try {
      elemento.contexto = this._contexto;
    } catch (erro) {
      console.error(`Seção ${id} falhou ao receber o contexto`, erro);
    }
  }

  ligarNavegacao() {
    this.querySelector('.f360-nav').addEventListener('click', (e) => {
      const link = e.target.closest('[data-ir-para]');
      if (!link) return;
      e.preventDefault();
      this.irPara(link.dataset.irPara);
    });
    this._aoIrPara = (e) => {
      if (e.detail?.simbolo === this._simbolo) this.irPara(e.detail.secao);
    };
    document.addEventListener('f360:ir-para', this._aoIrPara);

    let agendado = false;
    this._aoRolar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        agendado = false;
        this.marcarAtiva(this.secaoNaTela());
      });
    };
    window.addEventListener('scroll', this._aoRolar, { passive: true });
  }

  /**
   * Ultima secao cujo topo ja passou do topo fixo. No fim da pagina, a secao
   * pedida por ultimo (as finais nao conseguem subir ate o topo).
   */
  secaoNaTela() {
    const limite = this.querySelector('.f360-topo').getBoundingClientRect().bottom + 16;
    const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (noFim && this._pedida) return this._pedida;
    let atual = null;
    this.querySelectorAll('.f360-secao').forEach((s) => {
      if (s.getBoundingClientRect().top <= limite) atual = s.dataset.secaoId;
    });
    return atual;
  }

  irPara(secao, { atualizarLink = true } = {}) {
    const alvo = this.querySelector(`#f360-secao-${secao}`);
    if (!alvo) return;
    this._soltarAncora?.();
    this._pedida = secao;
    // replaceState: trocar de secao nao remonta a pagina (hashchange remontaria).
    if (atualizarLink) history.replaceState(null, '', hashDaFicha(this._simbolo, secao));
    alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.marcarAtiva(secao);
  }

  marcarAtiva(secao) {
    this.querySelectorAll('[data-ir-para]').forEach((a) => {
      const ativa = a.dataset.irPara === secao;
      a.classList.toggle('active', ativa);
      if (ativa) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  /** Altura do topo fixo vira variavel CSS: a ancora para logo abaixo dele. */
  medirTopo() {
    const topo = this.querySelector('.f360-topo');
    const aplicar = () => this.style.setProperty('--f360-topo-altura', `${topo.offsetHeight}px`);
    aplicar();
    if (typeof ResizeObserver === 'function') {
      this._observadorTopo = new ResizeObserver(aplicar);
      this._observadorTopo.observe(topo);
    }
  }
}

customElements.define('ficha-ativo-page', FichaAtivoPage);
