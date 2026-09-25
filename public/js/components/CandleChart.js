import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: desenhar um grafico de candlestick a partir de uma
// lista de candles OHLC ja normalizada (ver historicoApi.extrairCandles).
// Usa a lib lightweight-charts (TradingView), carregada globalmente via CDN
// no index.html - mesmo padrao do Bootstrap, sem bundler.
//
// Com poucos candles um grafico de velas nao diz nada (viraria um traco reto
// ou um unico retangulo) - por isso, abaixo de MIN_CANDLES, o componente
// mostra uma mensagem em vez de tentar desenhar.
const MIN_CANDLES = 5;

export class CandleChart extends BaseComponent {
  setCandles(candles) {
    this.destruirGrafico();
    this._candles = candles || [];
    this.innerHTML = this.template();

    if (this._candles.length >= MIN_CANDLES) {
      this.desenharGrafico();
    }
  }

  template() {
    if (!this._candles || this._candles.length === 0) {
      return '<p class="text-muted">Sem historico para exibir.</p>';
    }
    if (this._candles.length < MIN_CANDLES) {
      return `<p class="text-muted">So ${this._candles.length} candle(s) disponivel(is) nesse range - minimo de ${MIN_CANDLES} pra montar o grafico. Tente um range maior.</p>`;
    }
    return '<div class="candle-chart-container" style="height: 320px;"></div>';
  }

  desenharGrafico() {
    if (!window.LightweightCharts) {
      this.innerHTML = '<p class="text-muted">Biblioteca de graficos nao carregou.</p>';
      return;
    }

    const container = this.querySelector('.candle-chart-container');
    const chart = window.LightweightCharts.createChart(container, {
      autoSize: true,
      layout: { textColor: '#495057', background: { color: 'transparent' } },
      grid: { vertLines: { color: '#f1f1f1' }, horzLines: { color: '#f1f1f1' } },
      timeScale: { borderColor: '#dee2e6' },
      rightPriceScale: { borderColor: '#dee2e6' },
    });

    const serie = chart.addCandlestickSeries({
      upColor: '#198754',
      downColor: '#dc3545',
      borderVisible: false,
      wickUpColor: '#198754',
      wickDownColor: '#dc3545',
    });

    serie.setData(
      this._candles.map((c) => ({
        time: c.dataIso,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    chart.timeScale().fitContent();

    this._chart = chart;
  }

  disconnectedCallback() {
    this.destruirGrafico();
  }

  destruirGrafico() {
    if (this._chart) {
      this._chart.remove();
      this._chart = null;
    }
  }
}

customElements.define('candle-chart', CandleChart);
