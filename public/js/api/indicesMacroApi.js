// Unica responsabilidade: conhecer o endpoint de indices macroeconomicos
// (Selic, CDI, IPCA), lido do cache mantido pelo backend - nunca chama o
// Banco Central direto do navegador.
import { httpGet } from './httpClient.js';

export function buscarIndiceMacro(codigo) {
  return httpGet(`/indices-macro/${codigo}`);
}
