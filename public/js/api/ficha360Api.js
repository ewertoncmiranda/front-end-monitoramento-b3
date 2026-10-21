// Unica responsabilidade: saber de qual endpoint vem cada chave do
// FichaContexto (SPEC, Plano F360, contrato C2). Nao guarda cache nem trata
// erro: isso e do contexto.
import { httpGet } from './httpClient.js';

function umAnoAtras(hoje) {
  const d = new Date(Date.UTC(hoje.getUTCFullYear() - 1, hoje.getUTCMonth(), hoje.getUTCDate()));
  return d.toISOString().slice(0, 10);
}

const ROTAS = {
  ativo: (s) => `/ativos/${s}`,
  analise: (s) => `/analises/${s}/analise`,
  fundamentosCvm: (s) => `/analises/${s}/fundamentos-cvm`,
  fundamentosHistorico: (s) => `/analises/${s}/fundamentos-cvm/historico?anos=5`,
  identidade: (s) => `/ativos/${s}/identidade`,
  base: (s) => `/base/ativos?q=${s}&pagina=0&tamanho=10`,
  opiniao: (s) => `/ativos/${s}/opiniao`,
  fatores: (s) => `/ativos/${s}/fatores`,
  proventos: (s) => `/ativos/${s}/proventos-contabeis`,
  composicao: (s) => `/ativos/${s}/composicao-capital`,
  comunicados: (s, hoje) => `/empresas/${s}/comunicados?desde=${umAnoAtras(hoje)}`,
  noticias: (s) => `/noticias/${s}`,
  opcoes: (s) => `/ativos/${s}/opcoes`,
  operacional: (s) => `/operacional/tickers/${s}`,
  backtest: () => '/validacao/backtest',
  diario: (s) => `/validacao/diario?simbolo=${s}&limite=60`,
  premioRisco: (s) => `/ativos/${s}/premio-risco`,
  banco: (s) => `/ativos/${s}/banco`,
  pregoes: (s, hoje) => `/ativos/${s}/pregoes?intervalo=dia&de=${umAnoAtras(hoje)}`,
};

export const CHAVES_DO_CONTEXTO = Object.freeze(Object.keys(ROTAS));

/** Caminho HTTP da chave para o simbolo; null se a chave nao existe no contrato. */
export function rotaDaChave(chave, simbolo, hoje = new Date()) {
  const rota = ROTAS[chave];
  return rota ? rota(encodeURIComponent(simbolo), hoje) : null;
}

/** `/base/ativos` busca por prefixo: so a linha do simbolo exato interessa. */
function linhaExata(pagina, simbolo) {
  const alvo = String(simbolo).toUpperCase();
  return (pagina?.content || []).find((i) => String(i.simbolo).toUpperCase() === alvo) || null;
}

export async function buscarChave(chave, simbolo, hoje = new Date(), get = httpGet) {
  const rota = rotaDaChave(chave, simbolo, hoje);
  if (!rota) return null;
  const resposta = await get(rota);
  return chave === 'base' ? linhaExata(resposta, simbolo) : resposta;
}
