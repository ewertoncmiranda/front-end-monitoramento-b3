/**
 * Overlay: Canal
 */
export const overlayCanal = {
  id: 'canal',
  rotulo: 'Canal',
  horizonte: 'curto',
  calcular(candles) {
    const alto = Math.max(...candles.map(x => x.high)), baixo = Math.min(...candles.map(x => x.low));
    const linhas = [
      { price: alto, color: '#0d6efd', lineWidth: 2, lineStyle: 0, title: `Canal ↑ ${alto.toFixed(2)}` },
      { price: baixo, color: '#0d6efd', lineWidth: 2, lineStyle: 0, title: `Canal ↓ ${baixo.toFixed(2)}` },
    ];
    return { linhas, marcadores: [] };
  },
};
