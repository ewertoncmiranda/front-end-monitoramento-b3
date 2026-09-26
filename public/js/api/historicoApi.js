// Unica responsabilidade: conhecer o endpoint de historico OHLCV e normalizar
// a resposta bruta da BRAPI (candles com `date` em epoch/segundos) pro formato
// que a tabela e o grafico de candles consomem.
import { httpGet } from './httpClient.js';

// Ranges aceitos pelo plano Gratuito da BRAPI (validado em 2026-09-25) - "1y"
// devolve 400 INVALID_RANGE pra qualquer ticker fora da lista de demonstracao.
export const RANGES_DISPONIVEIS = [
  { valor: '5d', rotulo: '5 dias' },
  { valor: '1mo', rotulo: '1 mes' },
  { valor: '3mo', rotulo: '3 meses' },
];

export function buscarHistorico(simbolo, { range = '1mo', interval = '1d', sortOrder = 'asc' } = {}) {
  const params = new URLSearchParams({ symbols: simbolo, range, interval, sortOrder });
  return httpGet(`/api/v2/stocks/historical?${params.toString()}`);
}

/**
 * Extrai e normaliza os candles de uma resposta de /historical. `date` vem da
 * BRAPI em epoch (segundos); aqui ganha `dataFormatada` (pt-BR) e `dataIso`
 * (yyyy-mm-dd, formato exigido pelo lightweight-charts).
 */
export function extrairCandles(respostaHistorico) {
  const brutos = respostaHistorico?.results?.[0]?.data?.historicalDataPrice || [];
  return brutos.map((c) => {
    const data = new Date(c.date * 1000);
    return {
      ...c,
      ...precosAjustados(c),
      dataFormatada: data.toLocaleDateString('pt-BR'),
      dataIso: data.toISOString().slice(0, 10),
    };
  });
}

/**
 * Versao ajustada por proventos das quatro pontas da vela.
 *
 * O ponto delicado: ajustar SO o fechamento quebra a geometria - o close
 * ajustado pode cair fora do intervalo entre minima e maxima brutas, e ai o
 * candle vira um desenho impossivel e os detectores de padrao passam a ler
 * sombras que nao existem.
 *
 * A BRAPI entrega apenas `adjustedClose`. O fator de ajuste
 * (adjustedClose / close) e o mesmo para as quatro pontas naquele dia, entao
 * aplica-lo a todas preserva corpo, sombras e proporcoes.
 *
 * Medido no PETR4 em 3 meses: 40 dos 64 candles vinham com fator 0,97303 -
 * um dividendo de 2,7%. Sem o ajuste, o grafico mostra um gap de baixa onde
 * ninguem vendeu.
 */
function precosAjustados(c) {
  const fator = c.adjustedClose && c.close ? c.adjustedClose / c.close : 1;
  return {
    openAjustado: c.open * fator,
    highAjustado: c.high * fator,
    lowAjustado: c.low * fator,
    closeAjustado: c.adjustedClose ?? c.close,
    fatorAjuste: fator,
  };
}

/**
 * Devolve a serie na base pedida, com open/high/low/close ja apontando para
 * os valores certos. Quem consome (grafico e detectores) nao precisa saber
 * qual base esta em uso.
 */
export function comBase(candles, base = 'ajustado') {
  if (base !== 'ajustado') return candles;
  return candles.map((c) => ({
    ...c,
    open: c.openAjustado,
    high: c.highAjustado,
    low: c.lowAjustado,
    close: c.closeAjustado,
  }));
}
