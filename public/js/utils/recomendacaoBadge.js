// Unica responsabilidade: mapear uma recomendacao (contrato RespostaAnaliseIaDTO)
// para a classe de badge Bootstrap correspondente. Compartilhado entre qualquer
// componente que precise exibir uma recomendacao de forma consistente.
import { Recomendacao } from '../contracts/recomendacao.js';

const BADGE_POR_RECOMENDACAO = {
  COMPRA: 'bg-success',
  [Recomendacao.COMPRA_FORTE]: 'bg-success',
  [Recomendacao.COMPRA_MODERADA]: 'bg-success',
  VENDA: 'bg-danger',
  [Recomendacao.VENDA_VALUATION]: 'bg-danger',
  NEUTRO: 'bg-secondary',
  [Recomendacao.MANTER]: 'bg-secondary',
  [Recomendacao.ALERTA_RISCO]: 'bg-warning',
  [Recomendacao.SEM_DADOS]: 'bg-secondary',
};

export function badgeClassParaRecomendacao(recomendacao) {
  return BADGE_POR_RECOMENDACAO[recomendacao] || 'bg-secondary';
}
