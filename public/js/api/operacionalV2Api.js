// Cliente somente-leitura da Operabilidade V2. Enquanto o gestor ainda nao
// publicou uma rota, 404 vira um estado indisponivel explicavel pela tela.
import { httpGet } from './httpClient.js';

const INDISPONIVEL = Object.freeze({ indisponivel: true });

function consulta(params = {}) {
  const pares = Object.entries(params).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '');
  if (!pares.length) return '';
  return `?${pares.map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`).join('&')}`;
}

async function obter(caminho, params) {
  try {
    return await httpGet(`/operacional/${caminho}${consulta(params)}`);
  } catch (erro) {
    if (erro?.status === 404) return INDISPONIVEL;
    throw erro;
  }
}

function lista(dados, chave = 'itens') {
  if (dados?.indisponivel) return dados;
  const itens = Array.isArray(dados?.[chave]) ? dados[chave]
    : Array.isArray(dados?.content) ? dados.content
      : Array.isArray(dados) ? dados : [];
  return { ...(dados || {}), [chave]: itens };
}

export async function buscarTickers(filtros = {}) {
  const nomesApi = { statusOperacional: 'status' };
  const parametros = Object.fromEntries(Object.entries(filtros).map(([chave, valor]) => [nomesApi[chave] || chave, valor]));
  return lista(await obter('tickers', parametros));
}

export function buscarSnapshot(simbolo) {
  return obter(`tickers/${encodeURIComponent(String(simbolo).toUpperCase())}`);
}

export function buscarConsenso(simbolo) {
  return obter(`tickers/${encodeURIComponent(String(simbolo).toUpperCase())}/consenso`);
}

export function buscarTese(simbolo) {
  return obter(`tickers/${encodeURIComponent(String(simbolo).toUpperCase())}/tese`);
}

export async function buscarTimeline(simbolo, filtros = {}) {
  return lista(await obter(`tickers/${encodeURIComponent(String(simbolo).toUpperCase())}/timeline`, filtros));
}

export function buscarFiltrosOperacionais() {
  return obter('filtros');
}

export async function buscarAlertasOperacionais(filtros = {}) {
  return lista(await obter('alertas', filtros));
}

export const _teste = { consulta, lista };
