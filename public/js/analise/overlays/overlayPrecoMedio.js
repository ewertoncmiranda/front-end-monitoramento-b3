// MICRO-PAI-1: overlay "Preco medio do dia". Modulo puro (sem DOM).
// Escolha para intervalos agregados: o overlay so vale para velas DIARIAS.
// A media de uma semana/mes exigiria ponderar o preco medio de cada dia pelo
// volume, e o gestor nao devolve os dias de uma vela agregada; entao nesses
// intervalos o overlay fica desligado (e o painel explica por que).

export const OVERLAY_PRECO_MEDIO = {
  id: 'preco-medio',
  rotulo: 'Preço médio do dia',
  cor: '#6f42c1',
};

/** O overlay so se aplica a velas diarias que trazem o campo. */
export function precoMedioDisponivel(candles, intervalo = 'dia') {
  if (intervalo !== 'dia') return false;
  return (candles || []).some((c) => Number.isFinite(c?.precoMedio));
}

/** Linha { type:'line', points } para candle-chart.setLinhas; velas sem o campo sao puladas. */
export function linhaPrecoMedio(candles, intervalo = 'dia') {
  if (!precoMedioDisponivel(candles, intervalo)) return [];
  const points = candles
    .filter((c) => Number.isFinite(c.precoMedio))
    .map((c) => ({ time: c.dataIso, value: c.precoMedio }));
  if (points.length < 2) return [];
  return [{
    type: 'line',
    points,
    color: OVERLAY_PRECO_MEDIO.cor,
    lineWidth: 1,
    lineStyle: 2,
    title: 'Preço médio',
  }];
}
