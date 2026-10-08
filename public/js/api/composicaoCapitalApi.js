// Unica responsabilidade: conhecer GET /ativos/{simbolo}/composicao-capital
// (endpoint novo em OpcaoController, exposto pelo gestor). Retorna os dados
// de qt_acao_ordinaria / qt_acao_preferencial do ultimo DFP ou ITR disponivel.
import { httpGet } from './httpClient.js';

export function buscarComposicaoCapital(simbolo) {
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/composicao-capital`);
}
