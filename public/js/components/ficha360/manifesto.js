// Unica responsabilidade: a lista fixa de secoes da ficha (contrato C5) e o
// carregamento de cada uma. Cada secao e um modulo separado, importado sob
// demanda: secao que ainda nao existe nao derruba as outras.

export const SECOES = Object.freeze([
  { id: 'cabecalho', rotulo: 'Cabeçalho', ancora: false },
  { id: 'decisao', rotulo: 'Decisão', ancora: true },
  { id: 'grafico', rotulo: 'Gráfico', ancora: true },
  { id: 'valuation', rotulo: 'Valuation', ancora: true },
  { id: 'fundamentos', rotulo: 'Fundamentos', ancora: true },
  { id: 'proventos', rotulo: 'Proventos', ancora: true },
  { id: 'opcoes', rotulo: 'Opções', ancora: true },
  { id: 'eventos', rotulo: 'Eventos', ancora: true },
  { id: 'operacao', rotulo: 'Operação', ancora: true },
  { id: 'ia', rotulo: 'IA', ancora: true },
]);

export function secaoValida(id) {
  return SECOES.some((s) => s.id === id);
}

export function tagDaSecao(id) {
  return `secao-${id}`;
}

/** `ia` -> `./secoes/SecaoIa.js`, relativo a este modulo. */
export function caminhoDaSecao(id) {
  return `./secoes/Secao${id.charAt(0).toUpperCase()}${id.slice(1)}.js`;
}

/**
 * Importa o modulo da secao. true se o custom element ficou definido;
 * false se o arquivo nao existe ainda ou falhou ao carregar.
 */
export async function carregarSecao(
  id,
  importar = (caminho) => import(caminho),
  definido = (tag) => Boolean(globalThis.customElements?.get?.(tag)),
) {
  try {
    await importar(caminhoDaSecao(id));
  } catch {
    return false;
  }
  return definido(tagDaSecao(id));
}
