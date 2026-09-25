// Unica responsabilidade: conhecer o endpoint de /analises.
import { httpGet } from './httpClient.js';

export function buscarAnalise(simbolo) {
  return httpGet(`/analises/${encodeURIComponent(simbolo)}/analise`);
}
