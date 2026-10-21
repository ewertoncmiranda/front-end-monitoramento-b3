// Unica responsabilidade: logica pura de microestrutura das opcoes (MICRO-PAI-2).
// Preco justo = meio do spread, spread %, selo de strike corrigido e resumo da cadeia.
// Campos novos do gestor sao opcionais: tudo aqui devolve null/false quando ausentes.

// Acima desta diferenca relativa entre o ultimo fechamento e o meio do spread, o
// ultimo negocio e considerado defasado (10%).
export const LIMITE_DEFASAGEM_ULTIMO_NEGOCIO = 0.10;

function numero(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pegar(o, ...chaves) {
  for (const c of chaves) if (o && o[c] != null) return o[c];
  return undefined;
}

// Meio do spread. Usa o precoJusto do gestor; sem ele, deriva das ofertas (mesma regra:
// ausente, zero ou cruzada => null).
export function precoJusto(o) {
  const dado = numero(pegar(o, 'precoJusto', 'preco_justo'));
  if (dado != null) return dado > 0 ? dado : null;
  const c = numero(pegar(o, 'melhorOfertaCompra', 'melhor_oferta_compra'));
  const v = numero(pegar(o, 'melhorOfertaVenda', 'melhor_oferta_venda'));
  if (c == null || v == null || c <= 0 || v <= 0 || v < c) return null;
  return (c + v) / 2;
}

// Spread em pontos percentuais relativo ao meio. null quando nao ha preco justo.
export function spreadPercentual(o) {
  const meio = precoJusto(o);
  if (meio == null) return null;
  const dado = numero(pegar(o, 'spreadPercentual', 'spread_percentual'));
  if (dado != null) return dado;
  const c = numero(pegar(o, 'melhorOfertaCompra', 'melhor_oferta_compra'));
  const v = numero(pegar(o, 'melhorOfertaVenda', 'melhor_oferta_venda'));
  if (c == null || v == null) return null;
  return ((v - c) / meio) * 100;
}

// Dominio do INDOPC (COTAHIST, 1 char): "0", vazio ou ausente = sem correcao de strike;
// qualquer outro valor = strike corrigido por indice.
export function strikeCorrigido(o) {
  const v = pegar(o, 'indiceCorrecao', 'indice_correcao');
  if (v == null) return false;
  const t = String(v).trim();
  return t !== '' && t !== '0';
}

export function temOferta(o) {
  return precoJusto(o) != null;
}

export function ultimoNegocio(o) {
  const n = numero(pegar(o, 'preco_medio', 'precoMedio')) ?? numero(o?.fechamento);
  return n != null && n > 0 ? n : null;
}

// Preco usado nos calculos (premio/break-even/moneyness fallback): meio do spread se
// existir, senao ultimo negocio. origem: 'meio' | 'ultimo' | null.
export function precoParaCalculo(o) {
  const j = precoJusto(o);
  if (j != null) return { valor: j, origem: 'meio' };
  const u = ultimoNegocio(o);
  return u != null ? { valor: u, origem: 'ultimo' } : { valor: null, origem: null };
}

export const ROTULO_ORIGEM = { meio: 'pelo meio do spread', ultimo: 'último negócio' };

// Ultimo fechamento mais de `limite` distante do meio do spread (so quando ha preco justo).
export function ultimoNegocioDefasado(o, limite = LIMITE_DEFASAGEM_ULTIMO_NEGOCIO) {
  const j = precoJusto(o);
  const f = numero(o?.fechamento);
  if (j == null || f == null || f <= 0) return false;
  return Math.abs(f - j) / j > limite;
}

export function mediana(valores) {
  const v = valores.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// Resumo da cadeia do vencimento mais proximo: quantas series tem oferta e spread mediano.
export function resumoMicroestrutura(opcoes) {
  const lista = Array.isArray(opcoes) ? opcoes : [];
  const venc = lista.map((o) => pegar(o, 'data_vencimento', 'dataVencimento')).filter(Boolean).map(String).sort()[0] ?? null;
  const cadeia = venc ? lista.filter((o) => String(pegar(o, 'data_vencimento', 'dataVencimento')) === venc) : [];
  const comOferta = cadeia.filter(temOferta);
  return {
    vencimento: venc,
    series: cadeia.length,
    comOferta: comOferta.length,
    spreadMediano: mediana(comOferta.map(spreadPercentual).filter((x) => x != null)),
    strikesCorrigidos: cadeia.filter(strikeCorrigido).length,
  };
}
