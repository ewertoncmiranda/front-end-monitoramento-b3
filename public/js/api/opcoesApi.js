// Unica responsabilidade: conhecer GET /ativos/{simbolo}/opcoes (OpcaoController).
// Retorna { simboloSolicitado, simboloCanonico, aliasAplicado, status, motivo,
// vencimentos: ['YYYYMM', ...], opcoes: [OpcaoB3DTO, ...] }.
// vencimento opcional: filtra pelo mes (YYYYMM).
import { httpGet } from './httpClient.js';

const SAUDE_INDISPONIVEL = Object.freeze({ indisponivel: true });

export function buscarOpcoes(simbolo, vencimento) {
  const params = new URLSearchParams();
  if (vencimento) params.set('vencimento', vencimento);
  const qs = params.toString();
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/opcoes${qs ? `?${qs}` : ''}`);
}

// OPT-GES-3 ainda pode não estar publicado no gestor do ambiente. Nesse caso,
// 404 é um estado de compatibilidade da tela, não uma falha da cadeia atual.
export async function buscarSaudeOpcoes() {
  try {
    return await httpGet('/opcoes/saude');
  } catch (erro) {
    if (erro?.status === 404) return SAUDE_INDISPONIVEL;
    throw erro;
  }
}
