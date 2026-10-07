// Unica responsabilidade: formatadores numericos pt-BR compartilhados (REQ-UX-2).
// Ausente (null/undefined/NaN) sempre vira "-" (ou o `vazio` pedido), nunca 0.

const ausente = (v) => v === null || v === undefined || v === '' || Number.isNaN(Number(v));

export function formatarNumero(valor, casas = 2, vazio = '-') {
  if (ausente(valor)) return vazio;
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** 0.0734 -> "7,34%"; com `sinal`, "+7,34%". */
export function formatarPercentual(fracao, casas = 2, { sinal = false, vazio = '-' } = {}) {
  if (ausente(fracao)) return vazio;
  const n = Number(fracao) * 100;
  const texto = `${formatarNumero(n, casas)}%`;
  return sinal && n > 0 ? `+${texto}` : texto;
}

export function formatarMoeda(valor, vazio = '-') {
  if (ausente(valor)) return vazio;
  return `R$ ${formatarNumero(valor, 2)}`;
}

/** Variacao entre dois precos como fracao; null quando falta ponta ou a base e zero. */
export function variacao(atual, anterior) {
  if (ausente(atual) || ausente(anterior) || Number(anterior) === 0) return null;
  return Number(atual) / Number(anterior) - 1;
}
