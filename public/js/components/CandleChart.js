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
    this._marcadores = this._marcadores || [];
    this.innerHTML = this.template();

    if (this._candles.length >= MIN_CANDLES) {
      this.desenharGrafico();
    }
  }

  template() {
    if (!this._candles || this._candles.length === 0) {
      return '<p class="text-muted">Sem histórico para exibir.</p>';
    }
    if (this._candles.length < MIN_CANDLES) {
      return `<p class="text-muted">Há somente ${this._candles.length} vela(s) disponível(is) neste período. São necessárias pelo menos ${MIN_CANDLES} para montar o gráfico. Tente um período maior.</p>`;
    }
    return '<div class="candle-chart-container" style="height: 320px;"></div>';
  }

  desenharGrafico() {
    if (!window.LightweightCharts) {
      this.innerHTML = '<p class="text-muted">A biblioteca de gráficos não foi carregada.</p>';
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

    // Clique numa vela vira evento com a data; quem escuta decide o que
    // mostrar (a CandlesPage abre os comunicados do dia). Clique fora de vela
    // (area vazia, escala) nao traz `time` e e ignorado.
    chart.subscribeClick((parametro) => {
      const dataIso = dataDoClique(parametro && parametro.time);
      if (!dataIso) return;
      this.dispatchEvent(
        new CustomEvent('candle-clicado', { detail: { dataIso }, bubbles: true }),
      );
    });

    this._chart = chart;
    this._serie = serie;
    this.aplicarMarcadores();

    // Largura mudou (janela, barra lateral, painel de comunicados aberto):
    // reenquadra todas as velas. Registrado DEPOIS do createChart de
    // proposito - o ResizeObserver interno do autoSize dispara antes deste, e
    // o fitContent precisa ver a largura ja atualizada. Chamado antes (num
    // requestAnimationFrame, por exemplo), ele enquadra pela largura antiga e
    // o redimensionamento seguinte corta ou sobra velas nas bordas.
    if (typeof ResizeObserver === 'function') {
      let larguraAnterior = container.clientWidth;
      this._observador = new ResizeObserver(() => {
        if (container.clientWidth === larguraAnterior) return;
        larguraAnterior = container.clientWidth;
        chart.timeScale().fitContent();
      });
      this._observador.observe(container);
    }
  }

  /**
   * Marca velas no grafico. Cada marcador e
   * { dataIso, posicao: 'acima'|'abaixo', cor, texto, forma? }.
   *
   * Duas camadas independentes - padroes e comunicados - porque
   * series.setMarkers substitui o conjunto inteiro: sem separar, ligar um
   * padrao apagaria os marcadores de comunicado e vice-versa.
   */
  setMarcadores(marcadores) {
    this._marcadores = marcadores || [];
    this.aplicarMarcadores();
  }

  setMarcadoresComunicados(marcadores) {
    this._marcadoresComunicados = marcadores || [];
    this.aplicarMarcadores();
  }

  aplicarMarcadores() {
    if (!this._serie) return;
    const marcadores = [...(this._marcadores || []), ...(this._marcadoresComunicados || [])]
      .map((m) => ({
        time: m.dataIso,
        position: m.posicao === 'abaixo' ? 'belowBar' : 'aboveBar',
        color: m.cor,
        shape: m.forma || (m.posicao === 'abaixo' ? 'arrowUp' : 'arrowDown'),
        text: m.texto,
      }))
      // A lightweight-charts exige os marcadores em ordem crescente de data.
      .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    this._serie.setMarkers(marcadores);
  }

  disconnectedCallback() {
    this.destruirGrafico();
  }

  destruirGrafico() {
    if (this._observador) {
      this._observador.disconnect();
      this._observador = null;
    }
    if (this._chart) {
      this._chart.remove();
      this._chart = null;
      this._serie = null;
    }
  }
}

/**
 * A lightweight-charts devolve o `time` do clique no formato em que achar
 * melhor: a string 'AAAA-MM-DD' que recebeu ou um BusinessDay
 * { year, month, day }. Normaliza para ISO.
 */
function dataDoClique(tempo) {
  if (!tempo) return null;
  if (typeof tempo === 'string') return tempo;
  if (typeof tempo === 'object' && tempo.year) {
    const doisDigitos = (n) => String(n).padStart(2, '0');
    return `${tempo.year}-${doisDigitos(tempo.month)}-${doisDigitos(tempo.day)}`;
  }
  return null;
}

customElements.define('candle-chart', CandleChart);
