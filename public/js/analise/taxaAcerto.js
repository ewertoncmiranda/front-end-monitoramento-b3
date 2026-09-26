// Unica responsabilidade: medir se um padrao "acertou", e dizer com quanta
// confianca da para afirmar isso. Modulo puro.
//
// O ponto central deste arquivo, e a razao de ele existir separado do
// detector: TAXA DE ACERTO SOZINHA NAO SIGNIFICA NADA.
//
// Se o ativo subiu em 55% de todos os pregoes da janela, um padrao de alta
// que acerta 58% nao tem valor - ele esta praticamente empatado com "comprar
// em qualquer dia ao acaso". Por isso toda taxa aqui vem acompanhada da
// TAXA-BASE da propria janela, e a diferenca entre as duas e o unico numero
// que realmente informa alguma coisa.
//
// E com 3 meses de historico (~63 pregoes) a amostra e pequena: um padrao
// costuma aparecer 2 a 5 vezes. Percentual sobre 3 ocorrencias e ruido com
// aparencia de estatistica, entao abaixo de AMOSTRA_MINIMA nao exibimos
// percentual nenhum.

export const AMOSTRA_MINIMA = 5;
export const HORIZONTE_PADRAO = 3;

/**
 * Avalia um padrao sobre a serie.
 *
 * Criterio de acerto, explicito de proposito:
 *   - padrao de alta  -> acerto se o fechamento H pregoes depois for MAIOR
 *   - padrao de baixa -> acerto se for MENOR
 *   - padrao neutro   -> nao tem direcao, entao nao tem acerto a medir
 *
 * Ocorrencias perto do fim da serie sao descartadas: nao ha H pregoes
 * adiante para julgar. Contar essas como acerto ou erro seria inventar dado.
 */
export function avaliar(candles, ocorrencias, direcao, horizonte = HORIZONTE_PADRAO) {
  if (direcao === 'neutro') {
    return {
      avaliavel: false,
      motivo: 'Padrao sem direcao definida: nao ha o que classificar como acerto.',
      ocorrencias: ocorrencias.length,
    };
  }

  const julgaveis = ocorrencias.filter((i) => i + horizonte < candles.length);
  const descartadas = ocorrencias.length - julgaveis.length;

  const acertos = julgaveis.filter((i) => {
    const antes = candles[i].close;
    const depois = candles[i + horizonte].close;
    return direcao === 'alta' ? depois > antes : depois < antes;
  }).length;

  const base = taxaBase(candles, direcao, horizonte);
  const taxa = julgaveis.length ? (acertos / julgaveis.length) * 100 : null;

  return {
    avaliavel: true,
    horizonte,
    ocorrencias: ocorrencias.length,
    julgaveis: julgaveis.length,
    descartadas,
    acertos,
    taxa,
    taxaBase: base,
    // O unico numero que informa: quanto o padrao supera "um dia qualquer".
    vantagem: taxa !== null && base !== null ? taxa - base : null,
    amostraSuficiente: julgaveis.length >= AMOSTRA_MINIMA,
  };
}

/**
 * Taxa-base: em quantos por cento de TODOS os candles da janela o preco foi
 * na direcao esperada depois de H pregoes.
 *
 * E a referencia contra a qual o padrao precisa ser comparado. Sem ela,
 * qualquer numero acima de 50% parece bom - e nao e.
 */
export function taxaBase(candles, direcao, horizonte = HORIZONTE_PADRAO) {
  const julgaveis = [];
  for (let i = 0; i + horizonte < candles.length; i += 1) {
    julgaveis.push(i);
  }
  if (julgaveis.length === 0) return null;

  const favoraveis = julgaveis.filter((i) => {
    const antes = candles[i].close;
    const depois = candles[i + horizonte].close;
    return direcao === 'alta' ? depois > antes : depois < antes;
  }).length;

  return (favoraveis / julgaveis.length) * 100;
}

/**
 * Leitura textual do resultado, para a interface nao mostrar so numero solto.
 * A ordem das checagens importa: amostra insuficiente vem antes de qualquer
 * julgamento de qualidade.
 */
export function interpretar(resultado) {
  if (!resultado.avaliavel) {
    return { rotulo: 'Sem direcao', classe: 'bg-secondary', texto: resultado.motivo };
  }

  if (resultado.julgaveis === 0) {
    return {
      rotulo: 'Sem ocorrencia',
      classe: 'bg-secondary',
      texto: 'O padrao nao aparece nesta janela.',
    };
  }

  if (!resultado.amostraSuficiente) {
    // Mostra a contagem crua em vez de percentual. "2 de 3" e honesto;
    // "66,7%" da a 3 ocorrencias uma precisao que elas nao tem.
    return {
      rotulo: 'Amostra insuficiente',
      classe: 'bg-dark',
      texto:
        `${resultado.acertos} acerto(s) em ${resultado.julgaveis} ocorrencia(s). ` +
        `Abaixo de ${AMOSTRA_MINIMA} nao exibimos percentual de proposito: ` +
        'transformar isso em taxa daria a esses poucos casos uma precisao que eles nao tem. ' +
        `Para referencia, a taxa-base da janela e ${resultado.taxaBase === null ? '-' : resultado.taxaBase.toFixed(1) + '%'}.`,
    };
  }

  const v = resultado.vantagem;
  if (v === null) {
    return { rotulo: 'Indefinido', classe: 'bg-secondary', texto: 'Nao foi possivel comparar.' };
  }

  // Limites deliberadamente exigentes: com ~60 candles, vantagem de 10 pontos
  // ainda esta dentro do que o acaso produz com facilidade.
  if (v >= 15) {
    return {
      rotulo: 'Acima da base',
      classe: 'bg-success',
      texto: `Supera a taxa-base em ${v.toFixed(1)} pontos. Ainda assim, amostra pequena - trate como indicio, nao como evidencia.`,
    };
  }
  if (v <= -15) {
    return {
      rotulo: 'Abaixo da base',
      classe: 'bg-danger',
      texto: `Fica ${Math.abs(v).toFixed(1)} pontos ABAIXO da taxa-base: nesta janela, o padrao foi pior que um dia qualquer.`,
    };
  }
  return {
    rotulo: 'Empatado com a base',
    classe: 'bg-warning text-dark',
    texto:
      `Diferenca de ${v.toFixed(1)} pontos em relacao a taxa-base. Ou seja: nesta janela o padrao ` +
      'nao se distingue de escolher um dia ao acaso.',
  };
}
