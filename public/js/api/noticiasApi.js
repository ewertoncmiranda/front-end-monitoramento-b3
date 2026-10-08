// Unica responsabilidade: conhecer os endpoints de manchetes
// (servidos pelo proprio server.js, nao pelo backend Java - ver proxy/noticiasApi.js).
import { httpGet } from './httpClient.js';

export function buscarNoticias(simbolo) {
  return httpGet(`/noticias/${encodeURIComponent(simbolo)}`);
}

/** Agrega manchetes de varios tickers favoritos (CTR-PAI-NOT-01). */
export function buscarManchetesFavoritos(simbolos, nomes = []) {
  const params = new URLSearchParams({ simbolos: simbolos.join(',') });
  const nomesFiltrados = nomes.filter(Boolean);
  if (nomesFiltrados.length) params.set('nomes', nomes.join(','));
  return httpGet(`/noticias/favoritos?${params}`);
}
