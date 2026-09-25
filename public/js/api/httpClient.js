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
  const response = await executarFetch(() => fetch(`${apiConfig.baseUrl}${path}`));
  return handleResponse(response);
}

export async function httpPost(path) {
  const response = await executarFetch(() => fetch(`${apiConfig.baseUrl}${path}`, { method: 'POST' }));
  return handleResponse(response);
}

async function executarFetch(fazerRequisicao) {
  try {
    return await fazerRequisicao();
  } catch {
    throw new ApiError('Nao foi possivel conectar a API. Verifique se o backend esta rodando.', 0);
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
