// CARTEIRAS-CARDS — Proventos da carteira: RECEBIDOS (registrados no gestor) x
// ESTIMADOS (proventos por acao do ativo x quantidade detida na data com).
// Os dois nunca sao somados sem rotulo. Valores estimados sao BRUTOS.
import { operacoesEfetivas } from './carteiraPosicao.js';

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const arred2 = (v) => Math.round(v * 100) / 100;

/** Quantidade detida de um ticker no fim do dia `dataIso` (operacoes ate essa data, inclusive). */
export function quantidadeNaData(operacoes, simbolo, dataIso) {
  const alvo = String(simbolo).toUpperCase();
  let q = 0;
  for (const o of operacoesEfetivas(operacoes)) {
    if (String(o.simbolo).toUpperCase() !== alvo || String(o.executadaEm).slice(0, 10) > dataIso) continue;
    q += (o.tipo === 'COMPRA' ? 1 : -1) * (num(o.quantidade) ?? 0);
  }
  return Math.max(0, Math.round(q * 1e8) / 1e8);
}

/** O gestor pode repetir o mesmo evento: dedupe por tipo, valor, data com e pagamento. */
export function deduplicarProventos(lista = []) {
  const vistos = new Set();
  return lista.filter((p) => {
    const k = [p.tipo, p.valorPorAcao, p.ultimaDataComDireito, p.dataPagamento, p.periodoReferencia].join('|');
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

/**
 * Estimativa por ticker: eventos com data com >= primeira compra e <= hoje,
 * x quantidade na data com. Quem comprou depois da data com nao recebe;
 * quem vendeu antes recebe so o que ainda detinha.
 * @returns {{ total, eventos, aReceber }} ou null se nao houver evento com direito
 */
export function estimarProventosAtivo(operacoes, simbolo, proventos, hoje = new Date().toISOString().slice(0, 10)) {
  const efetivas = operacoesEfetivas(operacoes).filter((o) => String(o.simbolo).toUpperCase() === String(simbolo).toUpperCase());
  const primeira = efetivas.filter((o) => o.tipo === 'COMPRA').map((o) => String(o.executadaEm).slice(0, 10)).sort()[0];
  if (!primeira) return null;
  let total = 0;
  let eventos = 0;
  let aReceber = 0;
  for (const p of deduplicarProventos(proventos)) {
    const dataCom = p.ultimaDataComDireito ? String(p.ultimaDataComDireito).slice(0, 10) : null;
    const valor = num(p.valorPorAcao);
    if (!dataCom || valor === null || dataCom < primeira || dataCom > hoje) continue;
    const q = quantidadeNaData(operacoes, simbolo, dataCom);
    if (q <= 0) continue;
    total += q * valor;
    eventos += 1;
    if (p.dataPagamento && String(p.dataPagamento).slice(0, 10) > hoje) aReceber += 1;
  }
  return eventos ? { total: arred2(total), eventos, aReceber } : null;
}

/** Recebidos registrados no gestor, somados por ticker (valor liquido). */
export function somarRecebidos(proventosCarteira = []) {
  const mapa = new Map();
  for (const p of proventosCarteira) {
    const v = num(p.valorLiquido);
    if (!p.simbolo || v === null) continue;
    const s = String(p.simbolo).toUpperCase();
    const atual = mapa.get(s) ?? { total: 0, eventos: 0 };
    atual.total += v;
    atual.eventos += 1;
    mapa.set(s, atual);
  }
  return mapa;
}

/**
 * Por ticker: se o gestor tem recebidos, usa SO eles ('recebido'); senao a
 * estimativa ('estimado'); senao nada. Yield on cost = total / custo do ticker.
 * @returns {Map<string, {tipo, total, eventos, yieldOnCost}>}
 */
export function proventosPorAtivo({ recebidos = [], operacoes = [], proventosPorSimbolo = {}, custos = {}, hoje }) {
  const rec = somarRecebidos(recebidos);
  const simbolos = new Set(operacoesEfetivas(operacoes).map((o) => String(o.simbolo).toUpperCase()));
  const saida = new Map();
  for (const s of simbolos) {
    let r = null;
    if (rec.has(s)) r = { tipo: 'recebido', total: arred2(rec.get(s).total), eventos: rec.get(s).eventos };
    else {
      const e = estimarProventosAtivo(operacoes, s, proventosPorSimbolo[s] || [], hoje);
      if (e) r = { tipo: 'estimado', total: e.total, eventos: e.eventos, aReceber: e.aReceber };
    }
    if (!r) continue;
    const custo = num(custos[s]);
    saida.set(s, { ...r, yieldOnCost: custo && custo > 0 ? r.total / custo : null });
  }
  return saida;
}

/** Totais separados por natureza. */
export function totaisProventos(mapa) {
  let recebido = null;
  let estimado = null;
  for (const v of mapa.values()) {
    if (v.tipo === 'recebido') recebido = (recebido ?? 0) + v.total;
    else estimado = (estimado ?? 0) + v.total;
  }
  return { recebido: recebido === null ? null : arred2(recebido), estimado: estimado === null ? null : arred2(estimado) };
}
