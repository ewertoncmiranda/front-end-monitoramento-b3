// Unica responsabilidade: conhecer o endpoint de setores de mercado.
import { httpGet } from './httpClient.js';

export function listarSetores() {
  return httpGet('/setores');
}
