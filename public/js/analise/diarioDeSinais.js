// Unica responsabilidade: transformar a resposta de /validacao/diario no que
// a tela mostra. Modulo puro (sem DOM), para as regras de leitura serem
// testadas: agrupar a linha do tempo por pregao, dizer o estado de cada
// horizonte e decidir quando um numero do placar ja diz alguma coisa.

// Nome curto das versoes de regra em uso. A v2 roda em sombra (gerar-insights
// app/core/analysis/regra_v2.py): gravada no diario ao lado da v1, sem ir para a tela.
export const NOME_DA_VERSAO = {
  '2026.09.27-2': 'v1 (oficial)',
  '2026.09.26-2': 'v2 (sombra)',
  '2026.09.26-1': 'v1 antiga (sem juros)',
};

export function nomeDaVersaoDoDiario(versao) {
  return NOME_DA_VERSAO[versao] || versao;
}

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
 *
 * Com intervalo de confianca (infra#TASK-30), "acima" ou "abaixo" da base
 * exige que o intervalo de 95% do acerto NAO cruze a taxa-base; se cruza, a
 * diferenca pode ser ruido e a leitura e "indistinguivel". Sem intervalo
 * (resposta antiga), vale a regra anterior de 5 pontos.
 */
export function leituraDoPlacar(linha) {
  if (!linha.amostraSuficiente) {
    return { rotulo: 'Amostra insuficiente', classe: 'text-bg-secondary' };
  }
  if (linha.taxaAcerto === null || linha.taxaAcerto === undefined || linha.taxaBase === null || linha.taxaBase === undefined) {
    return { rotulo: 'Sem direção', classe: 'text-bg-light border' };
  }
  const ic = linha.icAcerto;
  if (ic && ic.inferior !== null && ic.superior !== null) {
    const base = Number(linha.taxaBase);
    if (Number(ic.inferior) > base) return { rotulo: 'Acima da base', classe: 'text-bg-success' };
    if (Number(ic.superior) < base) return { rotulo: 'Abaixo da base', classe: 'text-bg-danger' };
    return { rotulo: 'Indistinguível da base', classe: 'text-bg-warning' };
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

/** "58% (39–76%)": a taxa e o intervalo de 95%, quando houver. */
export function formatarTaxaComIc(fracao, ic) {
  const taxa = formatarTaxa(fracao);
  if (taxa === '—' || !ic || ic.inferior === null || ic.superior === null) return taxa;
  return `${taxa} (${(Number(ic.inferior) * 100).toFixed(0)}–${(Number(ic.superior) * 100).toFixed(0)}%)`;
}

/** "−1,0 a +8,2%": intervalo de 95% de um excesso medio. */
export function formatarIcPercentual(ic) {
  if (!ic || ic.inferior === null || ic.superior === null) return '';
  return `${formatarPercentual(ic.inferior).replace('%', '')} a ${formatarPercentual(ic.superior)}`;
}

/**
 * Intervalo de Wilson 95% (a mesma formula do gestor, tools/IntervaloConfianca),
 * para somas feitas na tela - como o resumo das compras do backtest.
 */
export function wilson(acertos, n) {
  if (!n) return null;
  const z = 1.959964;
  const p = acertos / n;
  const z2 = z * z;
  const centro = (p + z2 / (2 * n)) / (1 + z2 / n);
  const margem = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return { inferior: Math.max(0, centro - margem), superior: Math.min(1, centro + margem) };
}
