import { httpGet } from './httpClient.js';

export function buscarResumoProventos(simbolo, { de, ate } = {}) {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/proventos-resumo?${params}`);
}
