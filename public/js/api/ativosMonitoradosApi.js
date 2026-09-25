// Unica responsabilidade: conhecer o endpoint de listagem de ativos monitorados.
import { httpGet } from './httpClient.js';

export function listarAtivosMonitorados() {
  return httpGet('/ativos/registrados');
}
