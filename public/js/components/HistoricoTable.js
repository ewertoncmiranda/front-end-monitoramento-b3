import { BaseComponent } from './base/BaseComponent.js';

// Unica responsabilidade: renderizar a serie historica OHLCV (contrato de
// GET /api/v2/stocks/historical) como tabela responsiva.
export class HistoricoTable extends BaseComponent {
  setCandles(candles) {
    this._candles = candles || [];
    this.innerHTML = this.template();
  }

  template() {
    if (!this._candles || this._candles.length === 0) {
      return '<p class="text-muted">Sem histórico para exibir.</p>';
    }

    const linhas = this._candles
      .slice()
      .reverse()
      .map(
        (c) => `
          <tr>
            <td>${c.dataFormatada || '-'}</td>
            <td>${formatarNumero(c.open)}</td>
            <td>${formatarNumero(c.high)}</td>
            <td>${formatarNumero(c.low)}</td>
            <td>${formatarNumero(c.close)}</td>
            <td>${formatarVolume(c.volume)}</td>
          </tr>
        `
      )
      .join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-striped align-middle">
          <thead>
            <tr>
              <th>Data</th>
              <th>Abertura</th>
              <th>Maxima</th>
              <th>Minima</th>
              <th>Fechamento</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
  }
}

function formatarNumero(valor) {
  return valor === undefined || valor === null ? '-' : Number(valor).toFixed(2);
}

function formatarVolume(valor) {
  return valor === undefined || valor === null ? '-' : Number(valor).toLocaleString('pt-BR');
}

customElements.define('historico-table', HistoricoTable);
