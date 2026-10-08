const CHAVE_TEMA = 'b3.tema.v1';
const TEMAS_VALIDOS = new Set(['light', 'dark']);

function armazenamento() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizarTema(tema) {
  return tema === 'dark' ? 'dark' : 'light';
}

function temaDoSistema() {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function temaAtual() {
  const declarado = document.documentElement.getAttribute('data-bs-theme');
  if (TEMAS_VALIDOS.has(declarado)) return declarado;
  const salvo = armazenamento()?.getItem(CHAVE_TEMA);
  if (TEMAS_VALIDOS.has(salvo)) return salvo;
  return temaDoSistema();
}

export function aplicarTema(tema, { persistir = true, emitirEvento = true } = {}) {
  const proximo = normalizarTema(tema);
  document.documentElement.setAttribute('data-bs-theme', proximo);
  document.body?.classList?.add('bg-body-tertiary');
  document.body?.classList?.remove('bg-light');

  if (persistir) armazenamento()?.setItem(CHAVE_TEMA, proximo);
  if (emitirEvento) window.dispatchEvent(new CustomEvent('tema:alterado', { detail: { tema: proximo } }));
  return proximo;
}

export function alternarTema() {
  return aplicarTema(temaAtual() === 'dark' ? 'light' : 'dark');
}

export function inicializarTema() {
  return aplicarTema(temaAtual(), { persistir: false, emitirEvento: false });
}

export function rotuloTema(tema = temaAtual()) {
  return normalizarTema(tema) === 'dark'
    ? { acao: 'Usar tema claro', estado: 'Tema escuro ativo', icone: '☀️' }
    : { acao: 'Usar tema escuro', estado: 'Tema claro ativo', icone: '🌙' };
}
