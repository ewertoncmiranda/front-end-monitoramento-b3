/**
 * F360-PAI-3: Plano de operação (C7)
 * Função pura que calcula plano de trading a partir de analise, fundamentos, pregoes, backtest e opiniao.
 */

/**
 * Calcula ATR (Average True Range) - média de 14 pregões.
 * ATR = max(máx - mín, |máx - fech_ant|, |mín - fech_ant|)
 * @param {Array} pregoes - Array de velas [{max, min, fechamento}, ...] em ordem cronológica
 * @returns {number|null} ATR ou null se menos de 2 pregões
 */
function calcularATR(pregoes) {
  if (!pregoes || pregoes.length < 2) return null;
  
  const periodos = 14;
  const relevantes = pregoes.slice(-periodos);
  const trs = [];
  
  for (let i = 1; i < relevantes.length; i++) {
    const atual = relevantes[i];
    const anterior = relevantes[i - 1];
    const tr = Math.max(
      atual.max - atual.min,
      Math.abs(atual.max - anterior.fechamento),
      Math.abs(atual.min - anterior.fechamento)
    );
    trs.push(tr);
  }
  
  if (trs.length === 0) return null;
  const soma = trs.reduce((a, b) => a + b, 0);
  return soma / trs.length;
}

/**
 * Determina ação base a partir da recomendação da análise.
 * @param {string} recomendacao - Valor do campo recomendacao da analise
 * @returns {string} 'COMPRAR' | 'VENDER' | 'MANTER'
 */
function determinaAcaoBase(recomendacao) {
  if (!recomendacao) return 'MANTER';
  
  switch (recomendacao) {
    case 'COMPRA_FORTE':
      return 'COMPRAR';
    case 'COMPRA_MODERADA':
      return 'COMPRAR';
    case 'ALERTA_RISCO':
      return 'VENDER';
    case 'VENDA_VALUATION':
      return 'VENDER';
    default:
      return 'MANTER';
  }
}

/**
 * Determina força da ação base.
 * @param {string} recomendacao - Valor do campo recomendacao da analise
 * @returns {number} 0, 1 ou 2
 */
function determinaForca(recomendacao) {
  if (!recomendacao) return 0;
  
  switch (recomendacao) {
    case 'COMPRA_FORTE':
      return 2;
    case 'COMPRA_MODERADA':
      return 1;
    case 'ALERTA_RISCO':
      return 2;
    case 'VENDA_VALUATION':
      return 1;
    default:
      return 0;
  }
}

/**
 * Calcula valor justo base: média entre Graham e lpa × pl_setorial_mediana.
 * @param {object} fundamentosCvm - Dados fundamentais CVM
 * @param {object} analise - Dados de análise
 * @returns {number|null} Valor justo ou null
 */
function calcularValorJusto(fundamentosCvm, analise) {
  const valores = [];
  
  if (fundamentosCvm?.graham_number != null && fundamentosCvm.graham_number > 0) {
    valores.push(fundamentosCvm.graham_number);
  }
  
  if (fundamentosCvm?.lpa != null && fundamentosCvm.pl_setorial_mediana != null) {
    const plSetorial = fundamentosCvm.pl_setorial_mediana;
    if (plSetorial > 0) {
      valores.push(fundamentosCvm.lpa * plSetorial);
    }
  }
  
  if (analise?.valor_justo != null && analise.valor_justo > 0) {
    valores.push(analise.valor_justo);
  }
  
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/**
 * Monta plano de operação completo.
 * @param {object} dados - { analise, fundamentosCvm, pregoes, backtest, opiniao }
 * @returns {object} Plano de operação
 */
export function montarPlano(dados) {
  const { analise, fundamentosCvm, pregoes, backtest, opiniao } = dados;
  
  const precoAtual = analise?.preco_atual ?? null;
  if (precoAtual == null || precoAtual <= 0) {
    return {
      acao: 'MANTER',
      forca: 0,
      entrada: null,
      alvo: null,
      stop: null,
      rr: null,
      upside_pct: null,
      horizonte: opiniao?.horizonte ?? null,
      taxa_acerto: null,
      motivos: ['Preço atual indisponível'],
    };
  }
  
  // Menos de 15 pregões: entrada, stop e R/R ficam null
  if (!pregoes || pregoes.length < 15) {
    return {
      acao: 'MANTER',
      forca: 0,
      entrada: null,
      alvo: null,
      stop: null,
      rr: null,
      upside_pct: null,
      horizonte: opiniao?.horizonte ?? null,
      taxa_acerto: null,
      motivos: ['Menos de 15 pregões disponíveis'],
    };
  }
  
  const recomendacao = analise?.recomendacao ?? null;
  const acaoBase = determinaAcaoBase(recomendacao);
  let forca = determinaForca(recomendacao);
  
  const atr = calcularATR(pregoes);
  const valorJusto = calcularValorJusto(fundamentosCvm, analise);
  
  const motivos = [];
  let acao = acaoBase;
  let entrada = null;
  let stop = null;
  let alvo = valorJusto;
  
  if (acaoBase === 'COMPRAR') {
    // Suporte = menor mínima dos últimos 20 pregões
    const ultimos20 = pregoes.slice(-20);
    const suporte = Math.min(...ultimos20.map(p => p.min));
    
    // Stop = max(suporte, preço - 2*ATR)
    const stopComprar = Math.max(suporte, precoAtual - 2 * atr);
    
    // Entrada = [max(suporte, preço - ATR), preço]
    const entradaMin = Math.max(suporte, precoAtual - atr);
    entrada = { min: entradaMin, max: precoAtual };
    stop = stopComprar;
    
  } else if (acaoBase === 'VENDER') {
    // Resistência = maior máxima dos últimos 20 pregões
    const ultimos20 = pregoes.slice(-20);
    const resistencia = Math.max(...ultimos20.map(p => p.max));
    
    // Stop = min(resistência, preço + 2*ATR)
    const stopVender = Math.min(resistencia, precoAtual + 2 * atr);
    
    // Entrada = [preço, min(resistência, preço + ATR)]
    const entradaMax = Math.min(resistencia, precoAtual + atr);
    entrada = { min: precoAtual, max: entradaMax };
    stop = stopVender;
  }
  
  // R/R = |alvo - preço| / |preço - stop|
  let rr = null;
  if (alvo != null && stop != null && stop !== precoAtual) {
    rr = Math.abs(alvo - precoAtual) / Math.abs(precoAtual - stop);
  }
  
  // Se R/R < 1.5 ou alvo do lado errado, rebaixar para MANTER
  if (rr != null && rr < 1.5) {
    acao = 'MANTER';
    forca = 0;
    motivos.push(`R/R (${rr.toFixed(2)}) abaixo de 1,5`);
  }
  
  if (alvo != null) {
    if (acaoBase === 'COMPRAR' && alvo < precoAtual) {
      acao = 'MANTER';
      forca = 0;
      motivos.push('Alvo abaixo do preço atual');
    } else if (acaoBase === 'VENDER' && alvo > precoAtual) {
      acao = 'MANTER';
      forca = 0;
      motivos.push('Alvo acima do preço atual');
    }
  }
  
  // Upside = (alvo - preço) / preço * 100
  const upside_pct = alvo != null ? ((alvo - precoAtual) / precoAtual) * 100 : null;
  
  // Taxa de acerto do backtest para a recomendação de origem
  let taxa_acerto = null;
  if (backtest?.taxa_acerto != null && recomendacao) {
    taxa_acerto = backtest.taxa_acerto;
  }
  
  return {
    acao,
    forca,
    entrada,
    alvo,
    stop,
    rr,
    upside_pct,
    horizonte: opiniao?.horizonte ?? null,
    taxa_acerto,
    motivos,
  };
}
