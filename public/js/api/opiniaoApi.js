// Unica responsabilidade: conhecer GET /ativos/{simbolo}/opiniao (gestor
// TASK-OPI-1): opiniao por horizonte gerada pelo gerar-insights (modelo local
// ou regra), com aviso fixo.
import { httpGet } from './httpClient.js';

export function buscarOpiniao(simbolo) {
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/opiniao`);
}
