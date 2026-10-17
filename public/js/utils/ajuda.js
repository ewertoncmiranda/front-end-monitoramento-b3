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
    popover.classList.toggle('visivel', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
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
