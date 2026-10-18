// Unica responsabilidade: regras da busca reutilizavel de ativos (<busca-ativos>).
// Modulo puro: estado dos filtros, juncao da listagem base com o operacional
// (mesma regra da tela Ativos), dados de cada cartao e selecao de tickers.
import { FILTROS_OPERACIONAIS, filtrosAtivos, temFiltroOperacional } from '../components/ativos/FiltrosOperacionais.js';

export const TAMANHO_PAGINA = 12;

export const MODOS = Object.freeze(['unico', 'multiplo']);

export function estadoVazio() {
  return {
    q: '', setor: '', uf: '', pagina: 0,
    ...Object.fromEntries(FILTROS_OPERACIONAIS.map((chave) => [chave, ''])),
  };
}

/** Estado vindo do armazenamento ou do formulario, sem lixo e com tamanhos limitados. */
export function normalizarEstado(bruto = {}) {
  const base = estadoVazio();
  const texto = (v, max) => String(v ?? '').trim().slice(0, max);
  const pagina = Number.parseInt(bruto.pagina ?? 0, 10);
  const estado = {
    q: texto(bruto.q, 60),
    setor: texto(bruto.setor, 80),
    uf: texto(bruto.uf, 2).toUpperCase(),
    pagina: Number.isInteger(pagina) && pagina > 0 && pagina < 10000 ? pagina : 0,
  };
  for (const chave of FILTROS_OPERACIONAIS) estado[chave] = texto(bruto[chave], 30);
  return { ...base, ...estado };
}

/** Ha algo para buscar? Sem nenhum filtro a busca nao dispara sozinha. */
export function temCriterio(estado = {}) {
  return Boolean(estado.q || estado.setor || estado.uf || temFiltroOperacional(estado));
}

export function parametrosBase(estado, tamanho = TAMANHO_PAGINA) {
  return { q: estado.q, setor: estado.setor, uf: estado.uf, pagina: estado.pagina, tamanho };
}

export function parametrosOperacionais(estado, tamanho = TAMANHO_PAGINA) {
  return { busca: estado.q, setor: estado.setor, pagina: estado.pagina, tamanho, ...filtrosAtivos(estado) };
}

/**
 * Junta GET /painel/ativos com GET /operacional/tickers, como a tela Ativos:
 * com filtro operacional manda a lista operacional (enriquecida pela base);
 * sem ele, manda a base (enriquecida pelo operacional). Operacional fora do ar
 * nao derruba a busca.
 */
export function combinarListagem(base, operacionais, estado) {
  const itensBase = base?.content || [];
  const pagina = {
    itens: itensBase,
    totalPaginas: base?.totalPages ?? 1,
    totalItens: base?.totalElements ?? itensBase.length,
  };
  if (!operacionais || operacionais.indisponivel) return pagina;
  const itensOp = operacionais.itens || [];
  const chave = (item) => String(item.simbolo).toUpperCase();
  if (temFiltroOperacional(estado)) {
    const basePorSimbolo = new Map(itensBase.map((item) => [chave(item), item]));
    return {
      itens: itensOp.map((op) => ({ ...(basePorSimbolo.get(chave(op)) || op), operacional: op })),
      totalPaginas: operacionais.totalPages ?? 1,
      totalItens: operacionais.totalElements ?? itensOp.length,
    };
  }
  const opPorSimbolo = new Map(itensOp.map((item) => [chave(item), item]));
  return { ...pagina, itens: itensBase.map((item) => ({ ...item, operacional: opPorSimbolo.get(chave(item)) })) };
}

const simboloLimpo = (s) => String(s ?? '').trim().toUpperCase();

/** "PETR4, vale3,,PETR4" -> ['PETR4', 'VALE3']. */
export function lerSimbolos(texto) {
  return [...new Set(String(texto ?? '').split(',').map(simboloLimpo).filter((s) => /^[A-Z0-9]{3,12}$/.test(s)))];
}

/** Liga ou desliga um ticker. No modo unico, escolher troca o anterior. */
export function alternarSelecao(selecionados, simbolo, modo = 'unico') {
  const s = simboloLimpo(simbolo);
  if (!s) return [...selecionados];
  if (selecionados.includes(s)) return selecionados.filter((x) => x !== s);
  return modo === 'multiplo' ? [...selecionados, s] : [s];
}

export function removerSelecao(selecionados, simbolo) {
  const s = simboloLimpo(simbolo);
  return selecionados.filter((x) => x !== s);
}
