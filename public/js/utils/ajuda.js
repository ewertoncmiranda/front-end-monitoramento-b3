import { escaparHtml } from './html.js';

const CONTAINER = '[data-ajuda-container]';
const BOTAO = '[data-ajuda-toggle]';
const POPOVER = '.ajuda-popover';
let eventosInicializados = false;

function fechar(container) {
  const popover = container?.querySelector(POPOVER);
  const botao = container?.querySelector(BOTAO);
  popover?.classList.remove('visivel');
  botao?.setAttribute('aria-expanded', 'false');
}

function posicionar(popover, botao) {
  if (!popover?.getBoundingClientRect || !botao?.getBoundingClientRect) return;
  const largura = document.documentElement?.clientWidth || globalThis.innerWidth;
  const altura = globalThis.innerHeight;
  if (!largura || !altura) return;
  const ancora = botao.getBoundingClientRect();
  const caixa = popover.getBoundingClientRect();
  const esquerda = Math.max(8, Math.min(ancora.right - caixa.width, largura - caixa.width - 8));
  const abaixo = ancora.bottom + 6;
  const topo = abaixo + caixa.height <= altura - 8 ? abaixo : Math.max(8, ancora.top - caixa.height - 6);
  Object.assign(popover.style, { position: 'fixed', left: `${esquerda}px`, right: 'auto', top: `${topo}px`, maxHeight: `${altura - 16}px`, overflowY: 'auto' });
}

function inicializarEventos() {
  if (typeof document === 'undefined' || eventosInicializados) return;
  eventosInicializados = true;

  document.addEventListener('click', (evento) => {
    const fecharBotao = evento.target.closest('[data-ajuda-fechar]');
    if (fecharBotao) {
      fechar(fecharBotao.closest(CONTAINER));
      return;
    }

    const botao = evento.target.closest(BOTAO);
    if (!botao) return;
    const container = botao.closest(CONTAINER);
    const popover = container?.querySelector(POPOVER);
    if (!popover) return;

    const aberto = !popover.classList.contains('visivel');
    document.querySelectorAll(`${CONTAINER} ${POPOVER}.visivel`).forEach((outro) => {
      if (outro !== popover) fechar(outro.closest(CONTAINER));
    });
    popover.classList.toggle('visivel', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
    if (aberto) posicionar(popover, botao);
  });

  const fecharAbertos = () => document.querySelectorAll(`${CONTAINER} ${POPOVER}.visivel`).forEach((p) => fechar(p.closest(CONTAINER)));
  document.addEventListener('scroll', (evento) => {
    if (!evento.target?.closest?.(POPOVER)) fecharAbertos();
  }, true);
  globalThis.addEventListener?.('resize', fecharAbertos);

  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    document.querySelectorAll(`${CONTAINER} ${POPOVER}.visivel`).forEach((popover) => {
      const container = popover.closest(CONTAINER);
      fechar(container);
      container?.querySelector(BOTAO)?.focus?.();
    });
  });

  document.addEventListener('mousedown', (evento) => {
    if (evento.target.closest(CONTAINER)) return;
    document.querySelectorAll(`${CONTAINER} ${POPOVER}.visivel`).forEach((popover) => {
      fechar(popover.closest(CONTAINER));
    });
  });
}

/** Gera o botão e o popover contextual, com conteúdo externo sempre escapado. */
export function htmlAjuda(id, titulo, texto) {
  const identificador = escaparHtml(String(id));
  const tituloSeguro = escaparHtml(titulo);
  const textoSeguro = escaparHtml(texto);
  inicializarEventos();

  return `<span class="ajuda-contexto" data-ajuda-container>
    <button type="button" class="btn-ajuda" data-ajuda-toggle aria-label="Ajuda: ${tituloSeguro}"
      aria-expanded="false" aria-describedby="${identificador}-popover">?</button>
    <span class="ajuda-popover" id="${identificador}-popover" role="tooltip">
      <span class="ajuda-popover-cabecalho"><strong>${tituloSeguro}</strong>
        <button type="button" class="btn-ajuda-fechar" data-ajuda-fechar aria-label="Fechar ajuda">×</button>
      </span>
      <span class="ajuda-popover-texto">${textoSeguro}</span>
    </span>
  </span>`;
}
