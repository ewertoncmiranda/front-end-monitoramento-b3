import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';
import '../LoadingSpinner.js';

// Unica responsabilidade: o carrossel "Panorama do mercado" da Inicio (Plano
// MERC). Mostra um card por vez, troca sozinho a cada 10 s e da ao usuario
// setas, bolinhas, teclado (←/→), swipe e um botao de pausa. Nao sabe o que
// ha dentro dos cards: cada um se desenha (e falha) sozinho no seu host.
//
// API:
//   el.cards = [{ id, titulo, render(host), tituloErro? }]
//     render(host) desenha o card dentro de `host` (um <div>); pode ser async.
//     Se lancar ou rejeitar, so aquele card mostra o estado de erro
//     (titulo = tituloErro || "<titulo> indisponível").
//   el.intervaloMs = 10000                       tempo entre trocas automaticas
//   el.relogio = { setInterval, clearInterval }  injetavel (testes)
//   el.reduzirMovimento = true|false             sobrepoe prefers-reduced-motion
//   el.avancar() / el.voltar() / el.irPara(i) / el.indice
// Atribuir `cards` com o elemento no DOM redesenha tudo (e chama render de novo).
export const INTERVALO_PADRAO_MS = 10000;
const DISTANCIA_SWIPE_PX = 40;

const anuncio = (indice, total, titulo) => `Card ${indice + 1} de ${total}: ${titulo}`;

/** Moldura pura: regiao, hosts dos cards, controles e regiao viva. */
export function htmlMolduraCarrossel(cards, { titulo = 'Panorama do mercado', indice = 0 } = {}) {
  const lista = Array.isArray(cards) ? cards : [];
  const total = lista.length;
  // Sem cards ainda (a pagina atribui `cards` logo depois de montar): nada a mostrar.
  if (!total) return '';
  const multiplos = total > 1;
  return `<section class="carrossel-mercado__moldura" role="region" aria-roledescription="carrossel" aria-label="${escaparHtml(titulo)}">
    <div class="carrossel-mercado__topo">
      <h5 class="carrossel-mercado__titulo mb-0">${escaparHtml(titulo)}</h5>
      ${multiplos ? `<div class="carrossel-mercado__controles">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-alternar aria-pressed="false">Pausar</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-anterior aria-label="Card anterior"><span aria-hidden="true">‹</span></button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-proximo aria-label="Próximo card"><span aria-hidden="true">›</span></button>
      </div>` : ''}
    </div>
    <div class="carrossel-mercado__trilho">
      ${lista.map((card, i) => `<div class="carrossel-mercado__card" role="group" aria-roledescription="card"
          aria-label="${escaparHtml(`${card.titulo} (card ${i + 1} de ${total})`)}" data-card="${i}"${i === indice ? '' : ' hidden'}>
          <div data-card-host="${i}"></div>
        </div>`).join('')}
    </div>
    ${multiplos ? `<div class="carrossel-mercado__bolinhas" role="group" aria-label="Escolher card">
      ${lista.map((card, i) => `<button type="button" class="carrossel-mercado__bolinha" data-ir="${i}"
          aria-label="${escaparHtml(`Ir para o card ${i + 1}: ${card.titulo}`)}"${i === indice ? ' aria-current="true"' : ''}></button>`).join('')}
    </div>` : ''}
    <p class="visually-hidden" data-anuncio aria-live="polite" aria-atomic="true">${escaparHtml(anuncio(indice, total, lista[indice]?.titulo ?? ''))}</p>
  </section>`;
}

/** Desenha um card no host; erro (sincrono ou assincrono) fica so nele. */
export async function montarCard(card, host) {
  if (!host) return;
  host.innerHTML = '<loading-spinner></loading-spinner>';
  try {
    if (typeof card?.render !== 'function') throw new Error('Card sem render.');
    await card.render(host);
  } catch (erro) {
    host.innerHTML = htmlEstadoVazio({
      titulo: card?.tituloErro || `${card?.titulo || 'Card'} indisponível`,
      causa: erro?.message || 'Falha ao carregar.',
    });
  }
}

function prefereMenosMovimento() {
  try { return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches); }
  catch { return false; }
}

export class CarrosselMercado extends BaseComponent {
  constructor() {
    super();
    this._cards = [];
    this.indice = 0;
    this.intervaloMs = INTERVALO_PADRAO_MS;
    this.relogio = null;
    this.reduzirMovimento = null;
    this._pausas = new Set();
    this._timer = null;
    this._eventos = null;
  }

  get cards() { return this._cards; }
  set cards(lista) {
    this._cards = Array.isArray(lista) ? lista : [];
    this.indice = 0;
    if (this.isConnected) this.render();
  }

  get rodando() { return this._timer !== null; }

  template() {
    return htmlMolduraCarrossel(this._cards, { titulo: this.getAttribute?.('titulo') || undefined, indice: this.indice });
  }

  afterRender() {
    this.classList?.add('carrossel-mercado');
    this._pararTimer();
    this._eventos?.abort();
    this._eventos = new AbortController();
    const { signal } = this._eventos;
    const ouvir = (tipo, fn) => this.addEventListener(tipo, fn, { signal });

    this._cards.forEach((card, i) => montarCard(card, this.querySelector?.(`[data-card-host="${i}"]`)));

    ouvir('click', (e) => this._aoClicar(e));
    ouvir('keydown', (e) => this._aoTeclar(e));
    ouvir('mouseenter', () => this.pausar('mouse'));
    ouvir('mouseleave', () => this.retomar('mouse'));
    ouvir('focusin', () => this.pausar('foco'));
    ouvir('focusout', (e) => { if (!this.contains?.(e.relatedTarget)) this.retomar('foco'); });
    ouvir('pointerdown', (e) => { this._inicioToque = e.clientX; });
    ouvir('pointercancel', () => { this._inicioToque = null; });
    ouvir('pointerup', (e) => this._aoSoltar(e));

    this._mostrar(this.indice, { anunciar: false });
    this._iniciarTimer();
  }

  disconnectedCallback() {
    this._pararTimer();
    this._eventos?.abort();
    this._eventos = null;
  }

  avancar() { this._navegar(this.indice + 1); }
  voltar() { this._navegar(this.indice - 1); }
  irPara(i) { this._navegar(Number(i)); }

  /** Pausa por um motivo ('mouse', 'foco', 'usuario'); so volta a rodar quando todos saem. */
  pausar(motivo = 'usuario') {
    this._pausas.add(motivo);
    this._pararTimer();
    this._atualizarAnuncioVivo();
  }

  retomar(motivo = 'usuario') {
    this._pausas.delete(motivo);
    this._iniciarTimer();
    this._atualizarAnuncioVivo();
  }

  _navegar(i) {
    this._mostrar(i, { anunciar: true });
    // Navegacao manual reinicia a contagem para o card nao sumir logo depois.
    this._iniciarTimer();
  }

  _mostrar(i, { anunciar }) {
    const total = this._cards.length;
    if (!total || Number.isNaN(i)) return;
    this.indice = ((i % total) + total) % total;
    for (const card of this.querySelectorAll?.('[data-card]') || []) {
      card.hidden = Number(card.dataset.card) !== this.indice;
    }
    for (const bolinha of this.querySelectorAll?.('[data-ir]') || []) {
      if (Number(bolinha.dataset.ir) === this.indice) bolinha.setAttribute('aria-current', 'true');
      else bolinha.removeAttribute('aria-current');
    }
    const regiao = this.querySelector?.('[data-anuncio]');
    if (regiao && anunciar !== false) regiao.textContent = anuncio(this.indice, total, this._cards[this.indice]?.titulo ?? '');
  }

  _podeRodar() {
    const reduzir = this.reduzirMovimento ?? prefereMenosMovimento();
    return !reduzir && this._cards.length > 1 && this._pausas.size === 0 && this.isConnected !== false;
  }

  _iniciarTimer() {
    this._pararTimer();
    if (!this._podeRodar()) return;
    const relogio = this.relogio || globalThis;
    this._timer = relogio.setInterval(() => this._mostrar(this.indice + 1, { anunciar: true }), this.intervaloMs);
    this._atualizarAnuncioVivo();
  }

  _pararTimer() {
    if (this._timer === null) return;
    (this.relogio || globalThis).clearInterval(this._timer);
    this._timer = null;
  }

  // Padrao WAI-ARIA de carrossel: enquanto roda sozinho a regiao viva fica
  // "off" (nao interrompe o leitor a cada 10 s); parado, anuncia "card N de M".
  _atualizarAnuncioVivo() {
    this.querySelector?.('[data-anuncio]')?.setAttribute('aria-live', this.rodando ? 'off' : 'polite');
    const botao = this.querySelector?.('[data-alternar]');
    if (botao) {
      const pausadoPeloUsuario = this._pausas.has('usuario');
      botao.textContent = pausadoPeloUsuario ? 'Retomar' : 'Pausar';
      botao.setAttribute('aria-pressed', String(pausadoPeloUsuario));
    }
  }

  _aoClicar(e) {
    const alvo = e.target?.closest?.('[data-anterior],[data-proximo],[data-ir],[data-alternar]');
    if (!alvo) return;
    if (alvo.hasAttribute('data-anterior')) this.voltar();
    else if (alvo.hasAttribute('data-proximo')) this.avancar();
    else if (alvo.hasAttribute('data-ir')) this.irPara(alvo.dataset.ir);
    else if (this._pausas.has('usuario')) this.retomar('usuario');
    else this.pausar('usuario');
  }

  _aoTeclar(e) {
    if (e.defaultPrevented) return;
    // Campos de texto/selecao dentro dos cards usam as setas para si.
    if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === 'ArrowRight') { e.preventDefault?.(); this.avancar(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault?.(); this.voltar(); }
  }

  _aoSoltar(e) {
    const inicio = this._inicioToque;
    this._inicioToque = null;
    if (inicio === null || inicio === undefined || e.pointerType === 'mouse') return;
    const deslocamento = e.clientX - inicio;
    if (Math.abs(deslocamento) < DISTANCIA_SWIPE_PX) return;
    if (deslocamento < 0) this.avancar(); else this.voltar();
  }
}

if (!customElements.get?.('carrossel-mercado')) customElements.define('carrossel-mercado', CarrosselMercado);
