// Unica responsabilidade: comparar FCO bruto x FCO liquido (REQ-ETL-3). Puro, sem DOM.
// `fco_bruto` so existe para empresas com DFC pelo metodo direto; o liquido
// (`fluxo_caixa_operacional`) vem do metodo indireto. Ausente nunca vira zero.

const numero = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/**
 * @returns null quando bruto e liquido estao ausentes; senao
 * { bruto, liquido, delta, deltaPercentualDaReceita, maxAbs } com null no que nao da para calcular.
 * delta = bruto - liquido (so com os dois); percentual = delta / receita_liquida (so com receita > 0).
 */
export function compararFco({ fco_bruto: bruto, fluxo_caixa_operacional: liquido, receita_liquida: receita } = {}) {
  const b = numero(bruto);
  const l = numero(liquido);
  if (b === null && l === null) return null;
  const r = numero(receita);
  const delta = b !== null && l !== null ? b - l : null;
  return {
    bruto: b,
    liquido: l,
    delta,
    deltaPercentualDaReceita: delta !== null && r !== null && r > 0 ? (delta / r) * 100 : null,
    maxAbs: Math.max(Math.abs(b ?? 0), Math.abs(l ?? 0)) || 1,
  };
}
