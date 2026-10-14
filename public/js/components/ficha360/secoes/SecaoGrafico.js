import { BaseComponent } from '../../base/BaseComponent.js';
import '../../components/painelCandles/PainelCandles.js';

/**
 * F360-PAI-4: Seção Gráfico
 * Usa o painel de velas reutilizável e escuta o evento f360:destacar-data
 * para chamar focarData no gráfico quando o método existir (C3).
 */
export class SecaoGrafico extends BaseComponent {
  constructor() {
    super();
    this.contexto = null;
  }

  set contexto(ctx) {
    this._contexto = ctx;
    this.render();
  }

  get contexto() {
    return this._contexto;
  }

  template() {
    if (!this.contexto) {
      return `
        <div class="text-center py-4 text-muted">
          Seção em construção
        </div>
      `;
    }

    return `
      <painel-candles simbolo="${this.contexto.simbolo}"></painel-candles>
    `;
  }

  afterRender() {
    // Escutar evento f360:destacar-data
    this._ouvirDestacarData = (evento) => {
      const { simbolo, dataIso } = evento.detail;
      if (simbolo !== this.contexto?.simbolo) return;

      const painel = this.querySelector('painel-candles');
      if (!painel) return;

      const grafico = painel.querySelector('candle-chart');
      if (!grafico) return;

      // Verificar se o método focarData existe (C3)
      if (typeof grafico.focarData === 'function') {
        grafico.focarData(dataIso);
      }
    };

    document.addEventListener('f360:destacar-data', this._ouvirDestacarData);
  }

  disconnectedCallback() {
    if (this._ouvirDestacarData) {
      document.removeEventListener('f360:destacar-data', this._ouvirDestacarData);
    }
  }
}

customElements.define('secao-grafico', SecaoGrafico);
