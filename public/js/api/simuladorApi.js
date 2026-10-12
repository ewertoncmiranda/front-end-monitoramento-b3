import { httpClient } from './httpClient.js';

// SIM-PAI-1: API do simulador - CRUD de ativos monitorados

export async function listarAtivosSimulador() {
  return httpClient.get('/simulador/ativos');
}

export async function registrarAtivoSimulador(simbolo) {
  return httpClient.post('/simulador/ativos', new URLSearchParams({ simbolo }));
}

export async function desativarAtivoSimulador(simbolo) {
  return httpClient.delete('/simulador/ativos', new URLSearchParams({ simbolo }));
}

// SIM-PAI-2: Resultados agregados por estratégia
export async function buscarResultadosSimulador(simbolo, data) {
  const params = new URLSearchParams({ simbolo });
  if (data) params.set('data', data);
  return httpClient.get(`/simulador/resultados?${params}`);
}

// SIM-PAI-5: CRUD de operações manuais
export async function listarOperacoesSimulador() {
  return httpClient.get('/simulador/operacoes');
}

export async function criarOperacaoSimulador(simbolo, dataEntrada, capital, versaoEstrategia) {
  const params = new URLSearchParams({
    simbolo,
    dataEntrada,
    capital: capital.toString(),
    versaoEstrategia,
  });
  return httpClient.post('/simulador/operacoes', params);
}

export async function deletarOperacaoSimulador(id) {
  return httpClient.delete(`/simulador/operacoes/${id}`);
}

// SIM-PAI-2: Análise IA sob demanda
export async function analisarIaSimulador(simbolo) {
  return httpClient.post(`/simulador/ia/${simbolo}`);
}

// SIM-PAI-4: Retroativo
export async function retroativoSimulador(simbolo, estrategia, versao, janela, inicio) {
  const params = new URLSearchParams({
    simbolo,
    estrategia,
    versao: versao || 'v1',
    janela: janela?.toString() || '21',
    inicio,
  });
  return httpClient.get(`/simulador/retroativo?${params}`);
}

// SIM-PAI-3: Cenário pontual
export async function cenarioSimulador(simbolo, data, janela, capital) {
  const params = new URLSearchParams({
    simbolo,
    data,
    janela: janela?.toString() || '21',
    capital: capital.toString(),
  });
  return httpClient.get(`/simulador/cenario?${params}`);
}
