// Unica responsabilidade: conhecer os endpoints do Plano LAC no gestor
// (LAC-GES-1..3, infra V16): fatores, proventos contabeis e backtest por ranking.
import { httpGet } from './httpClient.js';

export function buscarFatores(simbolo) {
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/fatores`);
}

export function buscarProventosContabeis(simbolo) {
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/proventos-contabeis`);
}

export function buscarBacktestRanking() {
  return httpGet('/validacao/backtest?metodo=RANKING');
}
