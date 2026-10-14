/**
 * Overlay: Pivôs S/R
 */
export const overlayPivos = {
  id: 'pivos',
  rotulo: 'Pivôs S/R',
  horizonte: 'curto',
  calcular(candles) {
    const n = 2;
    const suportes = [], resistencias = [];
    for (let i = n; i < candles.length - n; i++) {
      const c = candles[i];
      let ehTopo = true, ehFundo = true;
      for (let d = 1; d <= n; d++) {
        if (candles[i - d].high >= c.high || candles[i + d].high >= c.high) ehTopo = false;
        if (candles[i - d].low <= c.low || candles[i + d].low <= c.low) ehFundo = false;
      }
      if (ehTopo) resistencias.push({ price: c.high, dataIso: c.dataIso, idx: i });
      if (ehFundo) suportes.push({ price: c.low, dataIso: c.dataIso, idx: i });
    }
    const linhas = [];
    const marcadores = [];
    suportes.forEach(p => linhas.push({ price: p.price, color: '#198754', lineWidth: 1, lineStyle: 2, title: `S ${p.price.toFixed(2)}` }));
    resistencias.forEach(p => linhas.push({ price: p.price, color: '#dc3545', lineWidth: 1, lineStyle: 2, title: `R ${p.price.toFixed(2)}` }));
    return { linhas, marcadores };
  },
};
