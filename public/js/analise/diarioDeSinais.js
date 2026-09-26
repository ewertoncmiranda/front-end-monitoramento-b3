// Unica responsabilidade: transformar a resposta de /validacao/diario no que
// a tela mostra. Modulo puro (sem DOM), para as regras de leitura serem
// testadas: agrupar a linha do tempo por pregao, dizer o estado de cada
// horizonte e decidir quando um numero do placar ja diz alguma coisa.

/** Linha do tempo: um bloco por pregao, mais recente primeiro. */
export function agruparPorPregao(linhaDoTempo) {
  const blocos = new Map();
  (linhaDoTempo || []).forEach((sinal) => {
    if (!blocos.has(sinal.dataPregao)) blocos.set(sinal.dataPregao, []);
    blocos.get(sinal.dataPregao).push(sinal);
  });
  return [...blocos.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dataPregao, sinais]) => ({
      dataPregao,
      sinais: [...sinais].sort((a, b) => (a.simbolo < b.simbolo ? -1 : 1)),
    }));
}

/**
 * Estado de um horizonte de um sinal:
 *   pendente   ainda nao venceu;
 *   suspeito   janela com provavel desdobramento (fora das estatisticas);
 *   acerto / erro   recomendacao com direcao, ja avaliada;
 *   neutro     recomendacao sem direcao (MANTER, ALERTA): so o retorno.
 */
export function estadoDoHorizonte(sinal, horizonte) {
  const resultado = sinal.resultados ? sinal.resultados[horizonte] : null;
  if (!resultado) return { estado: 'pendente' };
  if (resultado.eventoSuspeito) return { estado: 'suspeito', retorno: resultado.retornoLiquido };
  if (resultado.acerto === true) return { estado: 'acerto', retorno: resultado.retornoLiquido };
  if (resultado.acerto === false) return { estado: 'erro', retorno: resultado.retornoLiquido };
  return { estado: 'neutro', retorno: resultado.retornoLiquido };
}

/**
 * Leitura de uma linha do placar, no mesmo espirito da aba Velas: acerto so
 * informa comparado com a taxa-base, e so depois de amostra minima.
 */
export function leituraDoPlacar(linha) {
  if (!linha.amostraSuficiente) {
    return { rotulo: 'Amostra insuficiente', classe: 'text-bg-secondary' };
  }
  if (linha.taxaAcerto === null || linha.taxaAcerto === undefined || linha.taxaBase === null || linha.taxaBase === undefined) {
    return { rotulo: 'Sem direção', classe: 'text-bg-light border' };
  }
  const vantagem = Number(linha.taxaAcerto) - Number(linha.taxaBase);
  if (vantagem >= 0.05) return { rotulo: 'Acima da base', classe: 'text-bg-success' };
  if (vantagem <= -0.05) return { rotulo: 'Abaixo da base', classe: 'text-bg-danger' };
  return { rotulo: 'Igual à base', classe: 'text-bg-warning' };
}

export function formatarPercentual(fracao, casas = 1) {
  if (fracao === null || fracao === undefined || Number.isNaN(Number(fracao))) return '—';
  // 0.0315 * 100 da 3.1499999999999995 em ponto flutuante, e toFixed(1)
  // arredondaria para 3,1. toPrecision(12) descarta o ruido binario antes.
  const escala = 10 ** casas;
  const valor = Math.round(Number((Number(fracao) * 100).toPrecision(12)) * escala) / escala;
  return `${valor > 0 ? '+' : ''}${valor.toFixed(casas).replace('.', ',')}%`;
}

export function formatarTaxa(fracao) {
  if (fracao === null || fracao === undefined) return '—';
  return `${(Number(fracao) * 100).toFixed(0)}%`;
}
