// Unica responsabilidade: conhecer os endpoints de /analises.
import { httpGet } from './httpClient.js';

export function buscarAnalise(simbolo) {
  return httpGet(`/analises/${encodeURIComponent(simbolo)}/analise`);
}

export function buscarFundamentos(simbolo) {
  return httpGet(`/analises/${encodeURIComponent(simbolo)}/fundamentos`);
}

export function buscarFundamentosCvm(simbolo) {
  return httpGet(`/analises/${encodeURIComponent(simbolo)}/fundamentos-cvm`);
}
