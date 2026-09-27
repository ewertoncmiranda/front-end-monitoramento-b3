// Unica responsabilidade: conhecer os endpoints de /base - o universo amplo
// de ativos (cvm_ticker/cvm_empresa/cotacao_b3_diaria), nao so os favoritos.
import { httpGet } from './httpClient.js';

export function listarAtivosBase({ q, setor, pagina = 0, tamanho = 30 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (setor) params.set('setor', setor);
  params.set('pagina', pagina);
  params.set('tamanho', tamanho);
  return httpGet(`/base/ativos?${params.toString()}`);
}

export function listarSetoresBase() {
  return httpGet('/base/setores');
}
