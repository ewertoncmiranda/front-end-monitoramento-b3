import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarHistorico, extrairCandles, RANGES_DISPONIVEIS } from '../api/historicoApi.js';
import '../components/SeletorDeAtivos.js';
import '../components/CandleChart.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

const RANGE_PADRAO = '1mo';

// Unica responsabilidade: orquestrar a aba de candles - busca um simbolo,
// deixa escolher o range (dentro do que o plano Gratuito da BRAPI aceita) e
// delega o desenho a CandleChart. Nao decide "quantos candles bastam pra
// desenhar" - isso e responsabilidade do proprio CandleChart.
export class CandlesPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Candles</h4>
      <p class="text-muted small">Grafico de candlestick com o historico OHLC diario ja coletado pelo ecossistema. Sem candles suficientes no range escolhido, o grafico nao e desenhado.</p>
      <seletor-de-ativos rotulo-botao="Ver candles" placeholder="Ex.: PETR4"></seletor-de-ativos>
      <div class="btn-group my-3" role="group" aria-label="Range do grafico">
        ${RANGES_DISPONIVEIS.map(
          (r) =>
            `<button type="button" class="btn btn-outline-primary btn-sm range-btn ${r.valor === RANGE_PADRAO ? 'active' : ''}" data-range="${r.valor}">${r.rotulo}</button>`
        ).join('')}
      </div>
      <div id="candles-resultado"></div>
    `;
  }

  afterRender() {
    this._simbolo = null;
    this._range = RANGE_PADRAO;

    const form = this.querySelector('seletor-de-ativos');
    const resultado = this.querySelector('#candles-resultado');
    const botoesRange = this.querySelectorAll('.range-btn');

    form.addEventListener('ativo-buscado', (event) => {
      this._simbolo = event.detail.simbolo;
      this.carregarCandles(resultado);
    });

    botoesRange.forEach((botao) => {
      botao.addEventListener('click', () => {
        botoesRange.forEach((b) => b.classList.remove('active'));
        botao.classList.add('active');
        this._range = botao.dataset.range;
        if (this._simbolo) {
          this.carregarCandles(resultado);
        }
      });
    });
  }

  async carregarCandles(resultado) {
    resultado.innerHTML = '<loading-spinner></loading-spinner>';

    try {
      const historico = await buscarHistorico(this._simbolo, { range: this._range });
      const candles = extrairCandles(historico);
      resultado.innerHTML = `
        <h6 class="mt-2">${this._simbolo} - ${rotuloRange(this._range)} (${candles.length} candle${candles.length === 1 ? '' : 's'})</h6>
        <candle-chart></candle-chart>
      `;
      resultado.querySelector('candle-chart').setCandles(candles);
    } catch (erro) {
      resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }
}

function rotuloRange(valor) {
  return RANGES_DISPONIVEIS.find((r) => r.valor === valor)?.rotulo || valor;
}

customElements.define('candles-page', CandlesPage);
