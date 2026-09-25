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
      dataFormatada: data.toLocaleDateString('pt-BR'),
      dataIso: data.toISOString().slice(0, 10),
    };
  });
}
