// Unica responsabilidade: conhecer o endpoint de validacao das regras
// (diario de sinais, saude dos dados, backtest) expostos pelo
// gestor-ativos-brutos - infra#CTR-11, CTR-12, CTR-14.
import { httpGet } from './httpClient.js';

export function buscarDiarioDeSinais({ simbolo, limite } = {}) {
  const busca = new URLSearchParams();
  if (simbolo) busca.set('simbolo', simbolo);
  if (limite) busca.set('limite', String(limite));
  const consulta = busca.toString();
  return httpGet(`/validacao/diario${consulta ? `?${consulta}` : ''}`);
}

// Idade de cada fonte, cobertura por ativo e checagem BRAPI x COTAHIST (CTR-12).
export function buscarSaudeDosDados() {
  return httpGet('/validacao/saude-dados');
}

// Placar do ultimo backtest walk-forward, v1 x v2, calibracao x teste (CTR-14).
export function buscarBacktest() {
  return httpGet('/validacao/backtest');
}
