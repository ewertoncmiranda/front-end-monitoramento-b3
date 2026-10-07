// Unica responsabilidade: abas da ficha do ativo (REQ-UX-9) e o parametro
// `aba` do link compartilhavel. Modulo puro, sem DOM.

export const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'fundamentos', rotulo: 'Fundamentos' },
  { id: 'fatores', rotulo: 'Fatores e proventos' },
  { id: 'comunicados', rotulo: 'Comunicados' },
];

export const ABA_PADRAO = 'resumo';

/** Aba valida ou a padrao: valor desconhecido no link nunca quebra a ficha. */
export function abaValida(valor) {
  return ABAS.some((a) => a.id === valor) ? valor : ABA_PADRAO;
}

/** Aba pedida em "#/gestao/PETR4?aba=fatores". */
export function abaDoHash(hash) {
  const consulta = String(hash || '').split('?')[1] || '';
  return abaValida(new URLSearchParams(consulta).get('aba'));
}

/** "#/gestao/PETR4" (aba padrao fica fora do link) ou "#/gestao/PETR4?aba=fatores". */
export function hashDaFicha(simbolo, aba) {
  const base = `#/gestao/${encodeURIComponent(simbolo)}`;
  return abaValida(aba) === ABA_PADRAO ? base : `${base}?aba=${abaValida(aba)}`;
}

/** Navegacao por teclado entre abas (setas, Home, End); devolve o id da proxima ou null. */
export function proximaAba(atual, tecla) {
  const i = ABAS.findIndex((a) => a.id === atual);
  if (i < 0) return null;
  if (tecla === 'ArrowRight') return ABAS[(i + 1) % ABAS.length].id;
  if (tecla === 'ArrowLeft') return ABAS[(i - 1 + ABAS.length) % ABAS.length].id;
  if (tecla === 'Home') return ABAS[0].id;
  if (tecla === 'End') return ABAS[ABAS.length - 1].id;
  return null;
}
