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

/**
 * Formata um volume financeiro em reais com sufixo M/B.
 * Abaixo de 1M: sem sufixo (ex.: "R$ 999.999").
 * De 1M a 999M: sufixo M com 1 decimal (ex.: "R$ 2,1 M").
 * 1B+: sufixo B com 1 decimal (ex.: "R$ 2,1 B").
 */
export function formatarVolume(valor) {
  if (ausente(valor)) return '-';
  const v = Number(valor);
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} B`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
}
