// Unica responsabilidade: conhecer os endpoints de /ativos.
import { httpGet, httpPost } from './httpClient.js';

export function buscarCotacao(simbolo) {
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}`);
}

export function buscarCotacaoRobusta(simbolo) {
  return httpGet(`/ativos/robusto/${encodeURIComponent(simbolo)}`);
}

export function registrarAtivo(simbolo) {
  return httpPost(`/ativos/registrar/${encodeURIComponent(simbolo)}`);
}
