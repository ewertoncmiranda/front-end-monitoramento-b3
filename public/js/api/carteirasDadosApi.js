// Unica responsabilidade: juntar o que a tela de uma carteira precisa do gestor
// (operacoes, proventos, uma serie de fechamentos por ticker, setor, CDI, proxy
// do Ibovespa) com o minimo de requisicoes: UMA busca de pregoes por ticker
// serve preco atual, sparkline e evolucao. Falha parcial nao derruba o resto.
import { buscarSerieDesde } from './carteirasPrecoApi.js';
import { listarOperacoes, listarProventos } from './carteirasOperacoesApi.js';
import { listarAtivosBase } from './baseAtivosApi.js';
import { buscarIndiceMacro } from './indicesMacroApi.js';
import { httpGet } from './httpClient.js';
import { primeiraCompra } from '../analise/carteiraEvolucao.js';

/** O gestor nao tem serie do Ibovespa; BOVA11 (ETF) e o proxy, e a tela o rotula assim. */
export const PROXY_IBOV = 'BOVA11';

const cacheSetor = new Map();
const cacheProv = new Map();

/** Setor do ativo na base ("Sem setor" fica por conta de quem mostra); cache por sessao. */
export async function buscarSetor(simbolo) {
  if (cacheSetor.has(simbolo)) return cacheSetor.get(simbolo);
  const p = listarAtivosBase({ q: simbolo, tamanho: 5 })
    .then((r) => (r?.content || []).find((a) => String(a.simbolo).toUpperCase() === simbolo)?.setor ?? null)
    .catch(() => { cacheSetor.delete(simbolo); return null; });
  cacheSetor.set(simbolo, p);
  return p;
}

/** Proventos por acao do ativo (gestor /proventos/{ticker}); [] se falhar. */
export function buscarProventosAtivo(simbolo) {
  if (!cacheProv.has(simbolo)) {
    cacheProv.set(simbolo, httpGet(`/proventos/${encodeURIComponent(simbolo)}`).then((r) => (Array.isArray(r) ? r : [])).catch(() => { cacheProv.delete(simbolo); return []; }));
  }
  return cacheProv.get(simbolo);
}

const mais7 = (iso) => new Date(Date.parse(`${iso}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);

/** Preco de entrada de um ativo legado: o primeiro fechamento ate 7 dias apos a data (fim de semana/feriado). */
export function precoNaEntrada(serie, dataEntrada) {
  if (!serie?.length || !dataEntrada) return null;
  const p = serie.find((x) => x.dataIso >= dataEntrada);
  return p && p.dataIso <= mais7(dataEntrada) ? p.preco : null;
}

/**
 * Carrega tudo de uma carteira. Retorna { operacoes, recebidos, series, setores, proventosAtivo, erros }
 * onde `series[simbolo]` = { preco, dataIso, serie } ou null (ticker sem cotacao).
 */
export async function carregarDadosCarteira(carteira) {
  const erros = [];
  const [operacoes, recebidos] = await Promise.all([
    listarOperacoes(carteira.id),
    listarProventos(carteira.id).catch(() => null), // sem V43 ou sem proventos: omite sem erro
  ]);
  const primeira = primeiraCompra(operacoes);
  const desdePorSimbolo = {};
  for (const o of operacoes) {
    if (o.simbolo) {
      const s = String(o.simbolo).toUpperCase();
      const d = String(o.executadaEm).slice(0, 10);
      if (!desdePorSimbolo[s] || d < desdePorSimbolo[s]) desdePorSimbolo[s] = d;
    }
  }
  for (const a of carteira.ativos || []) {
    const s = String(a.simbolo).toUpperCase();
    if (!desdePorSimbolo[s] && a.dataEntrada) desdePorSimbolo[s] = a.dataEntrada;
  }
  // Evolucao: todos os tickers de operacao a partir da primeira compra da carteira.
  for (const s of Object.keys(desdePorSimbolo)) if (primeira && operacoes.some((o) => String(o.simbolo).toUpperCase() === s)) desdePorSimbolo[s] = primeira < desdePorSimbolo[s] ? primeira : desdePorSimbolo[s];
  const simbolos = Object.keys(desdePorSimbolo);
  const series = {};
  const setores = {};
  const proventosAtivo = {};
  await Promise.all(simbolos.map(async (s) => {
    const [serie, setor, prov] = await Promise.all([
      buscarSerieDesde(s, desdePorSimbolo[s]).catch(() => { erros.push(`cotação de ${s}`); return null; }),
      buscarSetor(s),
      operacoes.some((o) => String(o.simbolo).toUpperCase() === s) ? buscarProventosAtivo(s) : Promise.resolve([]),
    ]);
    series[s] = serie;
    setores[s] = setor;
    proventosAtivo[s] = prov;
  }));
  return { operacoes, recebidos, series, setores, proventosAtivo, erros, primeira };
}

/** CDI diario (% ao dia) desde a data e a serie do proxy do Ibovespa; cada falha vira `null` + aviso. */
export async function carregarReferencias(desde) {
  const avisos = [];
  const [cdi, proxy] = await Promise.all([
    buscarIndiceMacro('CDI', desde).then((r) => (Array.isArray(r) ? r : null)).catch(() => { avisos.push('CDI indisponível'); return null; }),
    buscarSerieDesde(PROXY_IBOV, desde).catch(() => { avisos.push(`${PROXY_IBOV} indisponível`); return null; }),
  ]);
  if (!proxy && !avisos.some((a) => a.startsWith(PROXY_IBOV))) avisos.push(`${PROXY_IBOV} sem cotações no gestor: linha omitida`);
  return { cdi, proxyIbov: proxy?.serie ?? null, avisos };
}
