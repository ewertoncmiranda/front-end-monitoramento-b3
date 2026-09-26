// Unica responsabilidade: conhecer o endpoint de validacao das regras
// (diario de sinais) exposto pelo gestor-ativos-brutos - infra#CTR-11.
import { httpGet } from './httpClient.js';

export function buscarDiarioDeSinais({ simbolo, limite } = {}) {
  const busca = new URLSearchParams();
  if (simbolo) busca.set('simbolo', simbolo);
  if (limite) busca.set('limite', String(limite));
  const consulta = busca.toString();
  return httpGet(`/validacao/diario${consulta ? `?${consulta}` : ''}`);
}
