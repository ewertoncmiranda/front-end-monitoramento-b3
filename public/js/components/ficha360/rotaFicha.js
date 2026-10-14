// Unica responsabilidade: ler e montar os links da ficha (#/ativo/PETR4?secao=x)
// e traduzir as rotas antigas para ela. Modulo puro (o armazenamento entra
// por parametro), usado pela pagina e pelo router.
import { secaoValida } from './manifesto.js';

export const CHAVE_ULTIMO = 'b3.ficha.ultimo.v1';

// Abas da ficha antiga (#/gestao/X?aba=...) -> secao equivalente da nova.
const SECAO_DA_ABA_ANTIGA = {
  resumo: 'decisao',
  fundamentos: 'fundamentos',
  fatores: 'proventos',
  comunicados: 'eventos',
  operabilidade: 'operacao',
};

function simboloLimpo(texto) {
  let s;
  try {
    s = decodeURIComponent(String(texto || '')).trim().toUpperCase();
  } catch {
    return '';
  }
  return /^[A-Z0-9]{3,12}$/.test(s) ? s : '';
}

/** `#/ativo/PETR4?secao=grafico` -> { simbolo: 'PETR4', secao: 'grafico' }. */
export function rotaDaFicha(hash) {
  const [caminho, consulta = ''] = String(hash || '').split('?');
  const simbolo = simboloLimpo(caminho.replace(/^#\/ativo\/?/, ''));
  const secao = new URLSearchParams(consulta).get('secao');
  return { simbolo, secao: secaoValida(secao) ? secao : null };
}

export function hashDaFicha(simbolo, secao = null) {
  const base = `#/ativo/${encodeURIComponent(simbolo)}`;
  return secao && secaoValida(secao) ? `${base}?secao=${secao}` : base;
}

/**
 * Para onde uma rota antiga deve ir, ou null se ela continua como esta.
 * `temGrafico`: a secao Grafico ja existe (so entao #/candles vira a ficha).
 */
export function redirecionamento(hash, { ultimo = '', temGrafico = false } = {}) {
  const [caminho, consulta = ''] = String(hash || '').split('?');
  const antiga = /^#\/(gestao|ficha)\/([^/]+)$/.exec(caminho);
  if (antiga) {
    const simbolo = simboloLimpo(antiga[2]);
    if (!simbolo) return null;
    const aba = new URLSearchParams(consulta).get('aba');
    return hashDaFicha(simbolo, SECAO_DA_ABA_ANTIGA[aba] || null);
  }
  if (caminho === '#/ficha') return '#/ativo';
  if (caminho === '#/candles' && temGrafico && simboloLimpo(ultimo)) {
    return hashDaFicha(simboloLimpo(ultimo), 'grafico');
  }
  return null;
}

export function lerUltimo(armazenamento = globalThis.localStorage) {
  try {
    return simboloLimpo(armazenamento?.getItem(CHAVE_ULTIMO));
  } catch {
    return '';
  }
}

export function guardarUltimo(simbolo, armazenamento = globalThis.localStorage) {
  try {
    armazenamento?.setItem(CHAVE_ULTIMO, simbolo);
  } catch {
    // Sem armazenamento (aba anonima): so nao lembra o ultimo ativo.
  }
}
