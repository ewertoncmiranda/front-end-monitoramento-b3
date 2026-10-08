// Unica responsabilidade: agregar manchetes de varios tickers, deduplicar,
// manter cache por ticker e expor a funcao noticiasFavoritos usada pela
// rota GET /noticias/favoritos do server.js (CTR-PAI-NOT-01).
//
// O parametro `buscar` e injetavel para facilitar os testes sem rede real.
// O parametro `agora` e injetavel para controle de tempo nos testes.

const TTL_CACHE_MS   = 15 * 60 * 1000;  // 15 min: cache fresco
const PAUSA_ERRO_MS  = 30 * 60 * 1000;  // 30 min: cooldown apos falha
const PARALELO_MAX   = 3;
const DIAS_MAX       = 7;
const MANCHETES_MAX  = 30;
const JACCARD_MIN    = 0.85;

// Cache em memoria: persiste enquanto o processo Node esta rodando.
// ticker -> { manchetes: [...], cachedAt: number, failedAt: number|null }
const _cache = new Map();

/**
 * Agrega manchetes de `simbolos` com deduplicacao e cache por ticker.
 *
 * @param {string[]} simbolos - array de tickers (ja validados e truncados)
 * @param {{ buscar?: Function, agora?: Function }} opcoes
 *   buscar(ticker) => Promise<Array<{titulo, link, fonte, publicadoEm}>>
 *   agora() => Date  — injetavel para testes
 * @returns {Promise<{geradoEm, desatualizado, manchetes, falhas}>}
 */
export async function noticiasFavoritos(simbolos, { buscar, agora = () => new Date() } = {}) {
  const agr = agora();
  const agorMs = agr.getTime();
  const corteMs = agorMs - DIAS_MAX * 24 * 60 * 60 * 1000;

  // Busca em paralelo, respeitando o limite de PARALELO_MAX simultaneos.
  const resultados = await _buscarEmParalelo(simbolos, buscar, agorMs);

  const falhas = [];
  let desatualizado = false;
  const brutos = []; // { titulo, link, fonte, publicadoEm, _ticker, _vencido }

  for (const res of resultados) {
    if (res.falha) { falhas.push(res.ticker); continue; }
    if (res.vencido) desatualizado = true;
    for (const m of res.manchetes) {
      brutos.push({ ...m, _ticker: res.ticker });
    }
  }

  const mescladas = _deduplicar(brutos);

  const manchetes = mescladas
    .filter((m) => {
      if (!m.publicadoEm) return false;
      const t = new Date(m.publicadoEm).getTime();
      return !Number.isNaN(t) && t >= corteMs;
    })
    .sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
    .slice(0, MANCHETES_MAX)
    .map(({ titulo, link, fonte, publicadoEm, simbolos: simbs }) =>
      ({ titulo, link, fonte, publicadoEm, simbolos: simbs }));

  return { geradoEm: agr.toISOString(), desatualizado, manchetes, falhas };
}

// --- Internals -----------------------------------------------------------

async function _buscarEmParalelo(simbolos, buscar, agorMs) {
  const resultados = [];
  for (let i = 0; i < simbolos.length; i += PARALELO_MAX) {
    const lote = simbolos.slice(i, i + PARALELO_MAX);
    const loteRes = await Promise.all(lote.map((s) => _buscarTicker(s, buscar, agorMs)));
    resultados.push(...loteRes);
  }
  return resultados;
}

async function _buscarTicker(ticker, buscar, agorMs) {
  const entrada = _cache.get(ticker);

  // Cache fresco: retorna sem buscar.
  if (entrada && !entrada.failedAt && agorMs - entrada.cachedAt < TTL_CACHE_MS) {
    return { ticker, manchetes: entrada.manchetes, vencido: false, falha: false };
  }

  // Dentro da pausa de erro: nao tenta de novo.
  if (entrada?.failedAt && agorMs - entrada.failedAt < PAUSA_ERRO_MS) {
    if (entrada.manchetes?.length) {
      return { ticker, manchetes: entrada.manchetes, vencido: true, falha: false };
    }
    return { ticker, manchetes: [], vencido: false, falha: true };
  }

  // Busca de verdade.
  try {
    const manchetes = await buscar(ticker);
    _cache.set(ticker, { manchetes, cachedAt: agorMs, failedAt: null });
    return { ticker, manchetes, vencido: false, falha: false };
  } catch {
    const prev = entrada?.manchetes ?? null;
    _cache.set(ticker, { manchetes: prev, cachedAt: entrada?.cachedAt ?? 0, failedAt: agorMs });
    if (prev?.length) {
      return { ticker, manchetes: prev, vencido: true, falha: false };
    }
    return { ticker, manchetes: [], vencido: false, falha: true };
  }
}

/**
 * Mescla manchetes de tickers diferentes: mesmo link ou Jaccard de titulo >= 0,85
 * resulta em uma so entrada com todos os tickers em `simbolos`.
 */
function _deduplicar(brutos) {
  const acc = []; // { titulo, link, fonte, publicadoEm, simbolos: Set }
  for (const m of brutos) {
    const existente = acc.find(
      (e) => e.link === m.link || _jaccard(e.titulo, m.titulo) >= JACCARD_MIN,
    );
    if (existente) {
      existente.simbolos.add(m._ticker);
    } else {
      acc.push({ titulo: m.titulo, link: m.link, fonte: m.fonte, publicadoEm: m.publicadoEm, simbolos: new Set([m._ticker]) });
    }
  }
  return acc.map((m) => ({ ...m, simbolos: [...m.simbolos] }));
}

function _jaccard(a, b) {
  const sa = _palavras(_normalizar(a));
  const sb = _palavras(_normalizar(b));
  if (sa.size === 0 && sb.size === 0) return 1;
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const p of sa) { if (sb.has(p)) inter++; }
  return inter / (sa.size + sb.size - inter);
}

function _normalizar(titulo) {
  return String(titulo ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove acentos
    .replace(/\s+-\s+\S+\s*$/, '')                     // remove " - Fonte" no fim
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function _palavras(texto) {
  return new Set(texto.split(/\s+/).filter(Boolean));
}

// Expoe o cache apenas para os testes (limpar entre cenarios).
export function _limparCache() { _cache.clear(); }
