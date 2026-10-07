// Unica responsabilidade: executar a chamada HTTP e traduzir falhas de rede/HTTP
// para um formato unico. Nao sabe nada sobre ativos, analises ou UI.
import { apiConfig } from '../config/apiConfig.js';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function httpGet(path) {
  const response = await executarFetch((signal) => fetch(`${apiConfig.baseUrl}${path}`, { signal }));
  return handleResponse(response);
}

export async function httpPost(path) {
  const response = await executarFetch((signal) => fetch(`${apiConfig.baseUrl}${path}`, { method: 'POST', signal }));
  return handleResponse(response);
}

export async function httpDelete(path) {
  const response = await executarFetch((signal) => fetch(`${apiConfig.baseUrl}${path}`, { method: 'DELETE', signal }));
  return handleResponse(response);
}

// Tempo limite por chamada: sem ele, gestor parado deixa a tela em spinner para sempre.
export const TEMPO_LIMITE_MS = 20000;

async function executarFetch(fazerRequisicao) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    return await fazerRequisicao(controle.signal);
  } catch (erro) {
    if (erro && erro.name === 'AbortError') {
      throw new ApiError(`A API não respondeu em ${TEMPO_LIMITE_MS / 1000} s. Veja a saúde dos dados em Avaliação.`, 0);
    }
    throw new ApiError('Não foi possível conectar à API. Verifique se o serviço está em execução.', 0);
  } finally {
    clearTimeout(timer);
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    throw new ApiError(`Falha na requisicao (HTTP ${response.status})`, response.status);
  }
  // Corpo vazio (ex.: 202 de /ativos/registrar, 204 generico) nao e JSON valido.
  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
}
