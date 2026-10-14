import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import { escaparHtml } from '../utils/html.js';
import '../components/SeletorDeAtivos.js';
import '../components/painelCandles/PainelCandles.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// F360-PAI-4: CandlesPage simplificada - apenas seletor de ativo + painel-candles
export class CandlesPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Velas (candles)</h4>
      <p class="text-muted small">
        Gráfico de velas com abertura, máxima, mínima e fechamento: até 3 meses pela BRAPI, e de
        6 meses a desde 2016 pelo preço oficial da B3, em velas de dia, semana ou mês. Ative os padrões no painel lateral (abaixo do gráfico, no
        celular); o significado de cada um está em <a href="#/padroes">Padrões e armadilhas</a>.
        Clique numa vela para ver os comunicados oficiais da CVM daquele dia.
      </p>

      <seletor-de-ativos rotulo-botao="Ver candles" placeholder="Ex.: PETR4"></seletor-de-ativos>

      <div id="candles-painel"></div>
    `;
  }

  afterRender() {
    this._simbolo = null;

    this.querySelector('seletor-de-ativos').addEventListener('ativo-buscado', (evento) => {
      this._simbolo = evento.detail.simbolo;
      this.renderPainel();
    });
  }

  renderPainel() {
    const painel = this.querySelector('#candles-painel');
    if (!this._simbolo) {
      painel.innerHTML = '<p class="text-muted">Selecione um ativo para ver o gráfico de velas.</p>';
      return;
    }
    painel.innerHTML = `<painel-candles simbolo="${this._simbolo}"></painel-candles>`;
  }
}

customElements.define('candles-page', CandlesPage);
