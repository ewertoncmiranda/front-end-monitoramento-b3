// Unica responsabilidade: conhecer as rotas GET /operacional/* do gestor (OPR-GES-2..4), que leem o
// paper trading gravado pelo gerar-insights (OPR-INS-4..7). Contrato no SPEC do painel, "Contrato
// /operacional/*" (CTR-OPR-PAI). So leitura: o painel nao decide operacao.
//
// 404 = o gestor desta versao ainda nao tem a rota (OPR-GES pendente): vira `{ indisponivel: true }`
// para a tela explicar em vez de quebrar. Outros erros (503, rede) sobem como ApiError.
import { httpGet } from './httpClient.js';

const INDISPONIVEL = Object.freeze({ indisponivel: true });

function consulta(params) {
  const pares = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return pares.length ? `?${pares.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}` : '';
}

async function obter(caminho, params) {
  try {
    return await httpGet(`/operacional/${caminho}${consulta(params)}`);
  } catch (erro) {
    if (erro && erro.status === 404) return INDISPONIVEL;
    throw erro;
  }
}

const lista = (dados) => (dados && dados.indisponivel ? dados : { ...(dados || {}), itens: Array.isArray(dados?.itens) ? dados.itens : [] });

/** Status do sistema e numeros do diario mais recente. */
export function buscarResumo() {
  return obter('resumo');
}

/** Serie diaria do paper trading; `inicio`/`fim` em AAAA-MM-DD (opcionais). */
export async function buscarDiario({ inicio, fim } = {}) {
  return lista(await obter('diario', { inicio, fim }));
}

/** Operacoes simuladas; `status` ABERTA|FECHADA|PENDENTE|CANCELADA e `simbolo` opcionais. */
export async function buscarOperacoes({ status, simbolo } = {}) {
  return lista(await obter('operacoes', { status, simbolo: simbolo ? String(simbolo).toUpperCase() : undefined }));
}

/** Sinais que nao viraram operacao (liquidez, dado ausente, evento, fundamento, risco); `data` opcional. */
export async function buscarBloqueios({ data } = {}) {
  return lista(await obter('bloqueios', { data }));
}

/** Prontidao dos dados, ultima execucao e violacoes (tambem usado pelo alerta, OPR-INFRA-4). */
export function buscarSaude() {
  return obter('saude');
}

export const _teste = { consulta };
