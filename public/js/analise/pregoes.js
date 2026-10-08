// Unica responsabilidade: metricas derivadas de uma serie de pregoes do banco.
// Modulo puro, sem DOM: recebe velas de velasDoBanco() e devolve calculos.

/**
 * Ticket medio de uma vela (R$ movimentado por negocio).
 * @param {number|null} volumeFinanceiro - volume_financeiro (sum over interval)
 * @param {number|null} numeroNegocios - numero_negocios (sum over interval)
 * @returns {number|null} ticket medio em R$, ou null quando indisponivel
 */
export function calcularTicketMedio(volumeFinanceiro, numeroNegocios) {
  if (
    volumeFinanceiro === null || volumeFinanceiro === undefined ||
    numeroNegocios === null || numeroNegocios === undefined ||
    Number(numeroNegocios) <= 0
  ) return null;
  return Number(volumeFinanceiro) / Number(numeroNegocios);
}

/**
 * Ticket medio medio de uma serie de velas (media ponderada pelo numero de negocios).
 * Retorna null quando nenhuma vela tem numero_negocios valido.
 */
export function ticketMedioDaSerie(velas) {
  if (!velas || velas.length === 0) return null;
  let totalVf = 0;
  let totalNn = 0;
  for (const v of velas) {
    if (v.numeroNegocios != null && v.numeroNegocios > 0 && v.volume != null) {
      // volume_financeiro = volume * preco_medio ~ volume * close (aproximado)
      totalVf += Number(v.volume) * Number(v.close);
      totalNn += Number(v.numeroNegocios);
    }
  }
  if (totalNn === 0) return null;
  return totalVf / totalNn;
}
