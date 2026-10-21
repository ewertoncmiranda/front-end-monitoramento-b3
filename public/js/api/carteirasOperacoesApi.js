// Unica responsabilidade: operacoes, proventos e rentabilidade de uma carteira
// no gestor (/carteiras/{id}/operacoes|proventos|rentabilidade).
import { httpEnviarJson, httpGet } from './httpClient.js';

const base = (id, ...resto) => ['/carteiras', encodeURIComponent(id), ...resto.map((p) => encodeURIComponent(p))].join('/');

export const listarOperacoes = async (id) => (await httpGet(base(id, 'operacoes'))) || [];
export const listarProventos = async (id) => (await httpGet(base(id, 'proventos'))) || [];

export async function listarRentabilidade(id, inicio, fim) {
  const q = new URLSearchParams({ inicio, fim });
  return (await httpGet(`${base(id, 'rentabilidade')}?${q}`)) || [];
}

/** Chave de idempotencia: uma por tentativa do usuario; reenviar a mesma e seguro (o gestor devolve a mesma operacao). */
export function novaChave(prefixo = 'painel') {
  const c = globalThis.crypto;
  const alea = c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefixo}-${alea}`.slice(0, 100);
}

const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Data AAAA-MM-DD de hoje no fuso do navegador. */
export const hojeLocal = () => localIso(new Date());

/** Hoje vira "agora - 1 min" (o gestor recusa futuro); outro dia vira 12:00. */
export function instanteDaOperacao(dia, agora = new Date()) {
  if (!dia || dia === localIso(agora)) {
    const d = new Date(agora.getTime() - 60000);
    return `${localIso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return `${dia}T12:00:00`;
}

/** Registra COMPRA ou VENDA (registro informado, nao ordem executada). */
export function registrarOperacao(id, { tipo, simbolo, data, quantidade, precoUnitario, custos = 0, chave }) {
  return httpEnviarJson('POST', base(id, 'operacoes'), {
    tipo,
    simbolo: String(simbolo).toUpperCase(),
    executadaEm: instanteDaOperacao(data),
    quantidade,
    precoUnitario,
    custos: custos || 0,
    moeda: 'BRL',
    chaveIdempotencia: chave || novaChave(tipo.toLowerCase()),
  });
}

export function estornarOperacao(id, operacaoId, chave = novaChave('estorno')) {
  return httpEnviarJson('POST', `${base(id, 'operacoes', operacaoId, 'estorno')}?chaveIdempotencia=${encodeURIComponent(chave)}`);
}
