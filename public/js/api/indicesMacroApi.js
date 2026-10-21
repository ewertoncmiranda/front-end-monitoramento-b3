// Unica responsabilidade: conhecer o endpoint de indices macroeconomicos
// (Selic, CDI, IPCA), lido do cache mantido pelo backend - nunca chama o
// Banco Central direto do navegador.
import { httpGet } from './httpClient.js';

// MACRO-PAI-1: painel de decisao consolidado (juro real, ciclo, Focus, barreira).
export function buscarPainelMacro() {
  return httpGet('/indices-macro/painel');
}

// desde (AAAA-MM-DD, opcional): so os pontos a partir da data (MACRO-GES-4).
export function buscarIndiceMacro(codigo, desde) {
  return httpGet(`/indices-macro/${codigo}${desde ? `?desde=${encodeURIComponent(desde)}` : ''}`);
}

// FONTES-PAI-5: curva de juro real (NTN-B). Pode vir 503 (gestor sem V45) ou com 'motivo'.
export function buscarCurvaReal() {
  return httpGet('/indices-macro/curva-real');
}
