// Unica responsabilidade: metricas derivadas de uma serie de pregoes do banco.
// Modulo puro, sem DOM: recebe velas de velasDoBanco() e devolve calculos.

const valido = (v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));

/**
 * Ticket medio de uma vela (R$ movimentado por negocio) = volume financeiro / numero de negocios.
 * @param {number|null} volumeFinanceiro - volume_financeiro (soma no intervalo)
 * @param {number|null} numeroNegocios - numero_negocios (soma no intervalo)
 * @returns {number|null} ticket medio em R$, ou null quando indisponivel (negocios <= 0 ou ausente)
 */
export function calcularTicketMedio(volumeFinanceiro, numeroNegocios) {
  if (!valido(volumeFinanceiro) || !valido(numeroNegocios) || Number(numeroNegocios) <= 0) return null;
  return Number(volumeFinanceiro) / Number(numeroNegocios);
}

/**
 * Ticket medio de uma vela do banco. Usa o volume financeiro quando o gestor o expoe
 * (`volumeFinanceiro`); sem ele, e SO para pregao diario, estima por quantidade x fechamento
 * e marca `estimado: true` (a tela mostra "≈"). Intervalo semanal/mensal sem volume financeiro: null.
 * @returns {{valor: number, estimado: boolean}|null}
 */
export function ticketMedioDaVela(vela) {
  if (!vela) return null;
  const exato = calcularTicketMedio(vela.volumeFinanceiro, vela.numeroNegocios);
  if (exato !== null) return { valor: exato, estimado: false };
  const diario = vela.pregoes === undefined || vela.pregoes === null || Number(vela.pregoes) <= 1;
  if (!diario || !valido(vela.volume) || !valido(vela.close)) return null;
  const estimado = calcularTicketMedio(Number(vela.volume) * Number(vela.close), vela.numeroNegocios);
  return estimado === null ? null : { valor: estimado, estimado: true };
}

/**
 * Ticket medio de uma serie de velas, ponderado pelo numero de negocios (soma de R$ / soma de negocios).
 * Velas sem ticket calculavel ficam de fora; null quando nenhuma serve.
 * @returns {{valor: number, estimado: boolean, velas: number}|null}
 */
export function ticketMedioDaSerie(velas) {
  let reais = 0;
  let negocios = 0;
  let usadas = 0;
  let estimado = false;
  for (const v of velas || []) {
    const t = ticketMedioDaVela(v);
    if (t === null) continue;
    reais += t.valor * Number(v.numeroNegocios);
    negocios += Number(v.numeroNegocios);
    usadas += 1;
    estimado = estimado || t.estimado;
  }
  return negocios > 0 ? { valor: reais / negocios, estimado, velas: usadas } : null;
}
