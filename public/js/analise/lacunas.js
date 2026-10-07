// Unica responsabilidade: regras de leitura do Plano LAC (fatores, proventos
// contabeis, backtest por ranking). Modulo puro, sem DOM.

export const FAMILIAS = {
  PRECO: 'Preço',
  QUALIDADE: 'Qualidade',
  VALOR: 'Valor',
  EVENTO: 'Evento',
};

const ORDEM = ['PRECO', 'QUALIDADE', 'VALOR', 'EVENTO'];

/** Agrupa os fatores por familia, na ordem preco, qualidade, valor, evento; familia desconhecida vai ao fim. */
export function agruparFatores(fatores) {
  const grupos = new Map();
  for (const f of fatores || []) {
    const chave = String(f.familia || '').toUpperCase();
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(f);
  }
  const chaves = [...grupos.keys()].sort((a, b) => {
    const ia = ORDEM.indexOf(a);
    const ib = ORDEM.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1);
  });
  return chaves.map((chave) => ({ chave, rotulo: FAMILIAS[chave] || chave || 'Outros', fatores: grupos.get(chave) }));
}

/** Percentil 0..1 (ou 0..100) em texto "P73"; ausente vira "—". */
export function formatarPercentilFator(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
  const n = Number(valor);
  return `P${Math.round(n <= 1 ? n * 100 : n)}`;
}

/**
 * Leitura do percentil respeitando a direcao esperada do fator (1: quanto maior
 * melhor; -1: quanto menor melhor). Devolve 'FAVORAVEL', 'DESFAVORAVEL' ou
 * 'NEUTRO'; sem percentil, null. Descreve a posicao, nao recomenda.
 */
export function leituraDoPercentil(percentil, direcaoEsperada) {
  if (percentil === null || percentil === undefined || !direcaoEsperada) return null;
  const n = Number(percentil) <= 1 ? Number(percentil) * 100 : Number(percentil);
  const posicao = direcaoEsperada > 0 ? n : 100 - n;
  if (posicao >= 66) return 'FAVORAVEL';
  if (posicao <= 33) return 'DESFAVORAVEL';
  return 'NEUTRO';
}

/** Barra 0..100 com marca na posicao; cor (classe) sempre acompanhada do texto "P73" ao lado na tabela. */
export function barraDePercentil(percentil, leitura) {
  if (percentil === null || percentil === undefined || Number.isNaN(Number(percentil))) return '<span class="text-muted">—</span>';
  const n = Number(percentil) <= 1 ? Number(percentil) * 100 : Number(percentil);
  const pos = Math.max(0, Math.min(100, n)).toFixed(0);
  const classe = { FAVORAVEL: 'favoravel', DESFAVORAVEL: 'desfavoravel' }[leitura] || 'neutro';
  return `<div class="barra-percentil ${classe}" role="img" aria-label="Posição ${pos} de 100 no universo"><div class="preenchimento" style="width:${pos}%"></div><div class="marca" style="left:${pos}%"></div></div>`;
}

const ORIGEM_PROVENTO = {
  DVA_CVM: 'DVA (CVM)',
  DVA: 'DVA (CVM)',
  MANUAL: 'Manual',
};

export function rotuloOrigem(origem) {
  return ORIGEM_PROVENTO[origem] || origem || 'origem não informada';
}

/** Soma de jcp + dividendos quando o total nao veio; null so se ambos faltam (nunca 0). */
export function totalDoProvento(p) {
  if (p.total !== null && p.total !== undefined) return Number(p.total);
  if ((p.jcp === null || p.jcp === undefined) && (p.dividendos === null || p.dividendos === undefined)) return null;
  return Number(p.jcp || 0) + Number(p.dividendos || 0);
}

/** 1134258 -> "R$ 1,13 mi"; ausente vira "—". */
export function formatarMoedaCompacta(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
  const n = Number(valor);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `R$ ${(n / 1e9).toFixed(2).replace('.', ',')} bi`;
  if (abs >= 1e6) return `R$ ${(n / 1e6).toFixed(2).replace('.', ',')} mi`;
  if (abs >= 1e3) return `R$ ${(n / 1e3).toFixed(1).replace('.', ',')} mil`;
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

/**
 * Veredito do ranking de uma janela: o IC 95% da correlacao media (Spearman)
 * decide. Todo acima de zero = 'ORDENA'; todo abaixo = 'ORDENA_AO_CONTRARIO';
 * cruza zero = 'INCONCLUSIVO'; sem IC (menos de 2 meses) = 'AMOSTRA_PEQUENA'.
 */
export function vereditoDoRanking(janela) {
  const ic = janela && janela.icCorrelacao;
  if (!ic || ic.inferior === null || ic.inferior === undefined) return 'AMOSTRA_PEQUENA';
  if (Number(ic.inferior) > 0) return 'ORDENA';
  if (Number(ic.superior) < 0) return 'ORDENA_AO_CONTRARIO';
  return 'INCONCLUSIVO';
}

export const VEREDITO_RANKING = {
  ORDENA: { rotulo: 'Ordena melhor que o acaso', classe: 'text-bg-success' },
  ORDENA_AO_CONTRARIO: { rotulo: 'Ordena ao contrário', classe: 'text-bg-danger' },
  INCONCLUSIVO: { rotulo: 'Inconclusivo (IC cruza zero)', classe: 'text-bg-secondary' },
  AMOSTRA_PEQUENA: { rotulo: 'Amostra pequena', classe: 'text-bg-light border' },
};

/** Janelas do ranking agrupadas por versao da regra, mantendo a ordem de chegada. */
export function janelasPorVersao(janelas) {
  const mapa = new Map();
  for (const j of janelas || []) {
    if (!mapa.has(j.versaoRegra)) mapa.set(j.versaoRegra, []);
    mapa.get(j.versaoRegra).push(j);
  }
  return [...mapa.entries()].map(([versao, lista]) => ({ versao, janelas: lista }));
}
