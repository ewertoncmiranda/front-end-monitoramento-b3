// CARTEIRAS-CARDS — Evolucao: carteira x CDI x Ibovespa (proxy), base 100.
// Logica pura. A carteira usa retorno ponderado pelo tempo (aportes e vendas
// nao viram "lucro"): indice_t = indice_(t-1) x (V_t - fluxo_t) / V_(t-1),
// onde V e o valor de mercado ao fechamento e fluxo = compras - vendas do dia.
// Precos de fechamento da B3 sem ajuste de proventos.
import { operacoesEfetivas } from './carteiraPosicao.js';

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const dia = (o) => String(o.executadaEm).slice(0, 10);

export const PERIODOS = [
  { valor: 'entrada', rotulo: 'Desde a entrada', meses: null },
  { valor: '3m', rotulo: '3 meses', meses: 3 },
  { valor: '6m', rotulo: '6 meses', meses: 6 },
  { valor: '12m', rotulo: '12 meses', meses: 12 },
];

/** Primeira compra (AAAA-MM-DD) entre as operacoes efetivas; null se nao houver. */
export function primeiraCompra(operacoes) {
  return operacoesEfetivas(operacoes).filter((o) => o.tipo === 'COMPRA').map(dia).sort()[0] ?? null;
}

/** Inicio do periodo escolhido: nunca antes da primeira compra. */
export function inicioDoPeriodo(periodo, primeira, hoje = new Date().toISOString().slice(0, 10)) {
  const p = PERIODOS.find((x) => x.valor === periodo);
  if (!primeira || !p || p.meses === null) return primeira;
  const d = new Date(`${hoje}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - p.meses);
  const corte = d.toISOString().slice(0, 10);
  return corte > primeira ? corte : primeira;
}

/** Ultimo valor da serie ordenada com data <= alvo (carrega o ultimo preco em dias sem pregao); null antes do inicio. */
export function valorNaData(serie, alvo, campo = 'preco') {
  let achado = null;
  for (const p of serie) {
    if (p.dataIso > alvo) break;
    achado = p[campo];
  }
  return achado;
}

/** Datas de pregao (uniao das series), ordenadas, desde `inicio`. */
export function datasDePregao(series, inicio) {
  const set = new Set();
  for (const s of Object.values(series)) for (const p of s || []) if (!inicio || p.dataIso >= inicio) set.add(p.dataIso);
  return [...set].sort();
}

/**
 * Indice da carteira (base 100 na primeira data com posicao e preco para todos os
 * ativos detidos). Dias em que algum ativo detido nao tem preco ate a data sao
 * pulados (sem inventar). Retorna [{dataIso, valor, patrimonio}].
 */
export function serieCarteira(operacoes, series) {
  const ops = operacoesEfetivas(operacoes).sort((a, b) => String(a.executadaEm).localeCompare(String(b.executadaEm)));
  const primeira = primeiraCompra(operacoes);
  if (!primeira) return [];
  const datas = datasDePregao(series, primeira);
  const qtd = {};
  let i = 0;
  let indice = null;
  let anterior = null;
  const saida = [];
  for (const d of datas) {
    let fluxo = 0;
    while (i < ops.length && dia(ops[i]) <= d) {
      const o = ops[i++];
      const s = String(o.simbolo).toUpperCase();
      const q = num(o.quantidade) ?? 0;
      const v = q * (num(o.precoUnitario) ?? 0) + (o.tipo === 'COMPRA' ? (num(o.custos) ?? 0) : 0);
      qtd[s] = (qtd[s] ?? 0) + (o.tipo === 'COMPRA' ? q : -q);
      fluxo += o.tipo === 'COMPRA' ? v : -v;
    }
    let patrimonio = 0;
    let completo = true;
    for (const [s, q] of Object.entries(qtd)) {
      if (q <= 0) continue;
      const preco = valorNaData(series[s] || [], d);
      if (preco === null) { completo = false; break; }
      patrimonio += q * preco;
    }
    if (!completo) continue;
    if (indice === null) {
      if (patrimonio <= 0) continue;
      indice = 100;
    } else if (anterior > 0) {
      indice *= (patrimonio - fluxo) / anterior;
    }
    anterior = patrimonio;
    saida.push({ dataIso: d, valor: indice, patrimonio });
  }
  return saida;
}

/** Recorta a serie a partir de `desde` e refaz a base 100 no primeiro ponto. */
export function fatiarERebasear(serie, desde) {
  const parte = serie.filter((p) => !desde || p.dataIso >= desde);
  if (!parte.length || !parte[0].valor) return [];
  const base = parte[0].valor;
  return parte.map((p) => ({ dataIso: p.dataIso, valor: (p.valor / base) * 100 }));
}

/** Serie de precos de um ticker (ex.: BOVA11) -> indice base 100 nas `datas`; null antes do primeiro preco. */
export function indiceDePrecos(serie, datas) {
  const brutos = datas.map((d) => ({ dataIso: d, valor: valorNaData(serie, d) })).filter((p) => p.valor !== null);
  return fatiarERebasear(brutos, null);
}

/**
 * CDI acumulado: pontos diarios em % ao dia ({data, valor}); o fator de cada dia
 * (inicio, d] e capitalizado. Base 100 na primeira data.
 */
export function indiceCdi(pontosCdi, datas) {
  if (!datas.length) return [];
  const pts = [...pontosCdi].filter((p) => num(p.valor) !== null).sort((a, b) => a.data.localeCompare(b.data));
  let j = 0;
  let indice = 100;
  const inicio = datas[0];
  while (j < pts.length && pts[j].data <= inicio) j++;
  return datas.map((d, k) => {
    if (k > 0) {
      while (j < pts.length && pts[j].data <= d) indice *= 1 + Number(pts[j++].valor) / 100;
    }
    return { dataIso: d, valor: indice };
  });
}

/** Retorno final (fracao) de uma serie base 100; null se vazia. */
export function retornoFinal(serie) {
  return serie.length ? serie[serie.length - 1].valor / 100 - 1 : null;
}

/** Diferenca em pontos percentuais entre dois retornos (fracoes); null se faltar um. */
export function diferencaPp(retA, retB) {
  return retA === null || retB === null || retA === undefined || retB === undefined ? null : (retA - retB) * 100;
}

/** Monta as linhas do grafico do periodo: carteira, CDI e (se houver) Ibov/proxy, mesmas datas. */
export function montarEvolucao({ operacoes, seriesPrecos, cdi, proxyIbov, periodo = 'entrada', hoje }) {
  const completa = serieCarteira(operacoes, seriesPrecos);
  const desde = inicioDoPeriodo(periodo, completa[0]?.dataIso ?? primeiraCompra(operacoes), hoje);
  const carteira = fatiarERebasear(completa, desde);
  if (carteira.length < 2) return { suficiente: false, carteira, cdi: [], ibov: [], retornos: {}, diferencaCdiPp: null };
  const datas = carteira.map((p) => p.dataIso);
  const cdiSerie = cdi ? indiceCdi(cdi, datas) : [];
  const ibov = proxyIbov && proxyIbov.length ? indiceDePrecos(proxyIbov, datas) : [];
  const retornos = { carteira: retornoFinal(carteira), cdi: cdiSerie.length ? retornoFinal(cdiSerie) : null, ibov: ibov.length ? retornoFinal(ibov) : null };
  return { suficiente: true, carteira, cdi: cdiSerie, ibov, retornos, diferencaCdiPp: diferencaPp(retornos.carteira, retornos.cdi) };
}
