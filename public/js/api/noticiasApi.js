// Unica responsabilidade: conhecer o endpoint de manchetes por ticker
// (servido pelo proprio server.js, nao pelo backend Java - ver proxy/noticiasApi.js).
import { httpGet } from './httpClient.js';

export function buscarNoticias(simbolo) {
  return httpGet(`/noticias/${encodeURIComponent(simbolo)}`);
}
