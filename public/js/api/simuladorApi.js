import { httpDelete, httpGet, httpPost } from './httpClient.js';

// SIM-PAI-1: API do simulador - CRUD de ativos monitorados

export async function listarTodosAtivosBase() {
  const dados = await httpGet('/base/ativos?tamanho=500&pagina=0');
  return (dados?.content || dados?.itens || []).map((a) => ({ simbolo: a.simbolo || a.ticker || a })).filter((a) => a.simbolo);
}

export async function listarAtivosSimulador() {
  return httpGet('/simulador/ativos');
}

export async function registrarAtivoSimulador(simbolo) {
  return httpPost('/simulador/ativos', new URLSearchParams({ simbolo }));
}

export async function desativarAtivoSimulador(simbolo) {
  return httpDelete('/simulador/ativos', new URLSearchParams({ simbolo }));
}

// SIM-PAI-2: Resultados agregados por estratégia
export async function buscarResultadosSimulador(simbolo, data) {
  const params = new URLSearchParams({ simbolo });
  if (data) params.set('data', data);
  return httpGet(`/simulador/resultados?${params}`);
}

// SIM-PAI-5: CRUD de operações manuais
export async function listarOperacoesSimulador() {
  return httpGet('/simulador/operacoes');
}

export async function criarOperacaoSimulador(simbolo, dataEntrada, capital, versaoEstrategia) {
  const params = new URLSearchParams({
    simbolo,
    dataEntrada,
    capital: capital.toString(),
    versaoEstrategia,
  });
  return httpPost('/simulador/operacoes', params);
}

export async function deletarOperacaoSimulador(id) {
  return httpDelete(`/simulador/operacoes/${id}`);
}

// SIM-PAI-2: Análise IA sob demanda
export async function analisarIaSimulador(simbolo, payload) {
  const body = payload ? new URLSearchParams({ resultados: JSON.stringify(payload.resultados || []) }) : undefined;
  return httpPost(`/simulador/ia/${simbolo}`, body);
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
  return httpGet(`/simulador/retroativo?${params}`);
}

// SIM-PAI-3: Cenário pontual
export async function cenarioSimulador(simbolo, data, janela, capital) {
  const params = new URLSearchParams({
    simbolo,
    data,
    janela: janela?.toString() || '21',
    capital: capital.toString(),
  });
  return httpGet(`/simulador/cenario?${params}`);
}
