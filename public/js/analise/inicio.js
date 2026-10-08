// Unica responsabilidade: regras de leitura dos blocos da pagina Inicio
// (REQ-UX-7). Puro, sem DOM.
import { variacao } from '../utils/numero.js';

/** Fontes fora do prazo, as piores (erro/atrasada) primeiro; `limite` corta a lista. */
export function fontesForaDoPrazo(saude, limite = 5) {
  const peso = { ERRO: 0, ATRASADA: 1, SEM_DADO: 2 };
  return ((saude && saude.fontes) || [])
    .filter((f) => f.estado !== 'OK')
    .sort((a, b) => (peso[a.estado] ?? 9) - (peso[b.estado] ?? 9) || (b.idadeHoras ?? 0) - (a.idadeHoras ?? 0))
    .slice(0, limite);
}

const magnitude = (m) => (m.variacao === null ? -1 : Math.abs(m.variacao)); // sem variacao vai por ultimo

/** Favoritos com variacao (preco atual contra o anterior registrado), maiores movimentos absolutos primeiro. */
export function maioresMovimentos(favoritos, limite = 6) {
  return (favoritos || [])
    .map((f) => ({ simbolo: f.simbolo, preco: f.precoAtual, variacao: variacao(f.precoAtual, f.precoAnterior) }))
    .sort((a, b) => magnitude(b) - magnitude(a) || (a.simbolo < b.simbolo ? -1 : 1))
    .slice(0, limite);
}

/**
 * Comunicado de destaque: primeiro FATO_RELEVANTE dos favoritos na edicao atual.
 * Retorna { simbolo, total, semana } ou null.
 */
export function comunicadoDestaqueDosFavoritos(edicao, simbolosFavoritos) {
  if (!edicao?.empresas || !simbolosFavoritos?.length) return null;
  const favSet = new Set(simbolosFavoritos);
  const candidato = edicao.empresas.find(
    (e) => favSet.has(e.simbolo) && (e.porCategoria?.FATO_RELEVANTE || 0) > 0,
  );
  if (!candidato) return null;
  return { simbolo: candidato.simbolo, total: candidato.porCategoria.FATO_RELEVANTE, semana: edicao.semana };
}

/** Numeros da edicao da semana e as empresas com fato relevante (a edicao ja vem com elas primeiro). */
export function resumoDaSemana(edicao) {
  const empresas = (edicao && edicao.empresas) || [];
  const comFato = empresas.filter((e) => (e.porCategoria || {}).FATO_RELEVANTE > 0);
  return {
    semana: edicao && edicao.semana,
    totalDocumentos: (edicao && edicao.totalDocumentos) || 0,
    totalEmpresas: empresas.length,
    comFatoRelevante: comFato.map((e) => e.simbolo),
    destaques: empresas.slice(0, 5).map((e) => ({
      simbolo: e.simbolo,
      total: e.total,
      fatoRelevante: (e.porCategoria || {}).FATO_RELEVANTE || 0,
    })),
  };
}
