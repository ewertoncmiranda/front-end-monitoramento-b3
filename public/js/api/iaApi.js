// Unica responsabilidade: conhecer as rotas do servico de IA (insider-ia SPEC
// 13.3), chamadas pelo proxy /ia/* do server.js (TASK-CHAT-1). O painel nao
// gera opiniao: so le o pacote do ativo, pede a leitura, conversa e resume
// manchetes.
import { apiConfig } from '../config/apiConfig.js';
import { ApiError } from './httpClient.js';
import { criarLeitorSSE } from '../analise/sse.js';

const PREFIXO = '/ia';
const TEMPO_LIMITE_MS = 60000;

async function chamarJson(caminho, { metodo = 'GET', corpo } = {}) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  let resposta;
  try {
    resposta = await fetch(`${apiConfig.baseUrl}${PREFIXO}${caminho}`, {
      method: metodo,
      headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    });
  } catch (erro) {
    throw new ApiError(erro && erro.name === 'AbortError'
      ? 'O serviço de IA não respondeu a tempo.'
      : 'Não foi possível conectar ao serviço de IA.', 0);
  } finally {
    clearTimeout(timer);
  }
  if (!resposta.ok) throw new ApiError(`Serviço de IA respondeu HTTP ${resposta.status}`, resposta.status);
  const texto = await resposta.text();
  return texto ? JSON.parse(texto) : null;
}

/** CTR-IA-03: pacote do ativo (cotacao, fundamentos, sinais, opiniao, comunicados, manchetes). Sem cota. */
export function buscarPacoteAtivo(simbolo) {
  return chamarJson(`/ativo/${encodeURIComponent(simbolo)}`);
}

/** CTR-IA-04: paragrafo de 3-4 frases sobre o ativo; cache por pregao no servico. */
export function gerarLeitura(simbolo) {
  return chamarJson(`/ativo/${encodeURIComponent(simbolo)}/leitura`, { metodo: 'POST', corpo: {} });
}

/** TASK-IA-38: 3 topicos citando links das manchetes enviadas. */
export function resumirManchetes(manchetes) {
  return chamarJson('/manchetes/resumo', { metodo: 'POST', corpo: { manchetes } });
}

/**
 * CTR-IA-02: conversa em streaming. Chama `aoEvento({evento, dados})` para
 * cada evento (inicio, token, fontes, aviso, fim, erro). Nunca rejeita por
 * falha do servico: a falha vira um evento `erro`, para a tela tratar num
 * lugar so. Abortar pelo `signal` encerra sem evento.
 */
export async function conversar({ sessaoId, mensagem, simbolo = null }, { aoEvento, signal } = {}) {
  const emitir = (evento, dados) => aoEvento && aoEvento({ evento, dados });
  let resposta;
  try {
    resposta = await fetch(`${apiConfig.baseUrl}${PREFIXO}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ sessao_id: sessaoId, mensagem, simbolo }),
      signal,
    });
  } catch (erro) {
    if (erro && erro.name === 'AbortError') return;
    emitir('erro', { codigo: 'INDISPONIVEL', mensagem: 'Não foi possível conectar ao assistente.', tentar_apos: null });
    return;
  }
  if (!resposta.ok || !resposta.body) {
    emitir('erro', {
      codigo: resposta.status === 429 ? 'LIMITE' : 'INDISPONIVEL',
      mensagem: `O assistente não respondeu (HTTP ${resposta.status}).`,
      tentar_apos: null,
    });
    return;
  }
  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();
  const sse = criarLeitorSSE();
  try {
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      for (const e of sse.alimentar(decodificador.decode(value, { stream: true }))) emitir(e.evento, e.dados);
    }
    for (const e of sse.alimentar(decodificador.decode())) emitir(e.evento, e.dados);
    for (const e of sse.finalizar()) emitir(e.evento, e.dados);
  } catch (erro) {
    if (erro && erro.name === 'AbortError') return;
    emitir('erro', { codigo: 'INDISPONIVEL', mensagem: 'A conexão com o assistente caiu.', tentar_apos: null });
  }
}
