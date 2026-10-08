// Unica responsabilidade: conhecer os endpoints de /base - o universo amplo
// de ativos (cvm_ticker/cvm_empresa/cotacao_b3_diaria), nao so os favoritos.
import { httpGet } from './httpClient.js';

export function listarAtivosBase({ q, setor, uf, pagina = 0, tamanho = 30 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (setor) params.set('setor', setor);
  if (uf) params.set('uf', uf);
  params.set('pagina', pagina);
  params.set('tamanho', tamanho);
  return httpGet(`/base/ativos?${params.toString()}`);
}

/** Situacao do registro na CVM e UF da sede de UM simbolo (via /base/ativos, busca exata). null se nao achar. */
export async function buscarSituacaoCvm(simbolo) {
  const alvo = String(simbolo).trim().toUpperCase();
  const pagina = await listarAtivosBase({ q: alvo, tamanho: 10 });
  const item = (pagina?.content || []).find((i) => String(i.simbolo).toUpperCase() === alvo);
  return item ? { situacaoRegistro: item.situacaoRegistro ?? null, uf: item.ufMunicipio ?? null } : null;
}

export function listarSetoresBase() {
  return httpGet('/base/setores');
}

export function listarAtivosPainel({
  q,
  setor,
  uf,
  favoritos = false,
  monitorados = false,
  pagina = 0,
  tamanho = 30,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (setor) params.set('setor', setor);
  if (uf) params.set('uf', uf);
  if (favoritos) params.set('favoritos', 'true');
  if (monitorados) params.set('monitorados', 'true');
  params.set('pagina', pagina);
  params.set('tamanho', tamanho);
  return httpGet(`/painel/ativos?${params.toString()}`);
}
