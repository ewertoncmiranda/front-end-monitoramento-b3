// Unica responsabilidade: mapear uma recomendacao (contrato RespostaAnaliseIaDTO)
// para a classe de badge Bootstrap correspondente. Compartilhado entre qualquer
// componente que precise exibir uma recomendacao de forma consistente.
const BADGE_POR_RECOMENDACAO = {
  COMPRA: 'bg-success',
  COMPRA_FORTE: 'bg-success',
  COMPRA_MODERADA: 'bg-success',
  VENDA: 'bg-danger',
  VENDA_VALUATION: 'bg-danger',
  NEUTRO: 'bg-secondary',
  MANTER: 'bg-secondary',
};

export function badgeClassParaRecomendacao(recomendacao) {
  return BADGE_POR_RECOMENDACAO[recomendacao] || 'bg-secondary';
}
