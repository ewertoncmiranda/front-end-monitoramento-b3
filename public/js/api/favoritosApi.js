// Unica responsabilidade: conhecer os endpoints de /favoritos.
import { httpGet, httpPost, httpDelete } from './httpClient.js';

export function listarFavoritos() {
  return httpGet('/favoritos');
}

export function favoritar(simbolo) {
  return httpPost(`/favoritos/${encodeURIComponent(simbolo)}`);
}

export function desfavoritar(simbolo) {
  return httpDelete(`/favoritos/${encodeURIComponent(simbolo)}`);
}
