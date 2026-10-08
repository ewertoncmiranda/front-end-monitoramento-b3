// Unica responsabilidade: conhecer GET /ativos/{simbolo}/opcoes (OpcaoController).
// Retorna { simbolo, vencimentos: ['YYYYMM', ...], opcoes: [OpcaoB3DTO, ...] }.
// vencimento opcional: filtra pelo mes (YYYYMM).
import { httpGet } from './httpClient.js';

export function buscarOpcoes(simbolo, vencimento) {
  const params = new URLSearchParams();
  if (vencimento) params.set('vencimento', vencimento);
  const qs = params.toString();
  return httpGet(`/ativos/${encodeURIComponent(simbolo)}/opcoes${qs ? `?${qs}` : ''}`);
}
