// Unica responsabilidade: conhecer o endpoint de historico OHLCV.
import { httpGet } from './httpClient.js';

export function buscarHistorico(simbolo, { range = '1mo', interval = '1d', sortOrder = 'asc' } = {}) {
  const params = new URLSearchParams({ symbols: simbolo, range, interval, sortOrder });
  return httpGet(`/api/v2/stocks/historical?${params.toString()}`);
}
