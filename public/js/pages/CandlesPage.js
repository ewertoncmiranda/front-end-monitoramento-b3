import { BaseComponent } from '../components/base/BaseComponent.js';
import {
  RANGES_DISPONIVEIS,
  buscarHistorico,
  comBase,
  extrairCandles,
} from '../api/historicoApi.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import '../components/SeletorDeAtivos.js';
import '../components/CandleChart.js';
import '../components/PainelPadroes.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

const RANGE_PADRAO = '1mo';
const BASE_PADRAO = 'ajustado';

// Unica responsabilidade: orquestrar a aba de candles - escolher ativo, range
// e base de preco, e alimentar o grafico e o painel de padroes. Nao decide
// "quantos candles bastam pra desenhar" (isso e do CandleChart) nem detecta
// padrao (isso e do PainelPadroes).
//
// Layout: o bloco do grafico fica fixo no topo enquanto os cartoes de padrao
// rolam por baixo. Sem CSS proprio - usa `sticky-md-top` do Bootstrap, que so
// gruda a partir de telas medias; no celular um grafico fixo comeria metade
// da tela util.
export class CandlesPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Candles</h4>
      <p class="text-muted small">
        Grafico de candlestick com o historico OHLC diario ja coletado pelo ecossistema.
        Ligue padroes sobre o grafico no painel abaixo; o que cada um significa esta em
        <a href="#/padroes">Padroes e armadilhas</a>.
      </p>

      <seletor-de-ativos rotulo-botao="Ver candles" placeholder="Ex.: PETR4"></seletor-de-ativos>

      <div id="candles-fixo" class="sticky-md-top bg-body pt-2 pb-2 mt-2"></div>
      <div id="candles-padroes" class="mt-3"></div>
      <div id="candles-erro"></div>
    `;
  }

  afterRender() {
    this._simbolo = null;
    this._range = RANGE_PADRAO;
    this._base = BASE_PADRAO;

    this.querySelector('seletor-de-ativos').addEventListener('ativo-buscado', (evento) => {
      this._simbolo = evento.detail.simbolo;
      this.carregar();
    });

    // Delegacao: os controles sao recriados a cada render do bloco fixo.
    this.addEventListener('click', (evento) => {
      const botaoRange = evento.target.closest('[data-range]');
      if (botaoRange && botaoRange.dataset.range !== this._range) {
        this._range = botaoRange.dataset.range;
        this.carregar();
      }
    });

    this.addEventListener('change', (evento) => {
      if (evento.target.id !== 'base-preco') return;
      this._base = evento.target.checked ? 'ajustado' : 'bruto';
      this.carregar();
    });
  }

  async carregar() {
    if (!this._simbolo) return;

    const fixo = this.querySelector('#candles-fixo');
    const areaPadroes = this.querySelector('#candles-padroes');
    const erro = this.querySelector('#candles-erro');

    erro.innerHTML = '';
    fixo.innerHTML = '<loading-spinner></loading-spinner>';
    areaPadroes.innerHTML = '';

    let candles;
    try {
      const historico = await buscarHistorico(this._simbolo, { range: this._range });
      candles = comBase(extrairCandles(historico), this._base);
    } catch (e) {
      fixo.innerHTML = '';
      erro.innerHTML = `<status-alert mensagem="${e.message}" variante="danger"></status-alert>`;
      return;
    }

    fixo.innerHTML = this.templateFixo(candles);
    areaPadroes.innerHTML = '<painel-padroes></painel-padroes>';

    const grafico = fixo.querySelector('candle-chart');
    const painel = areaPadroes.querySelector('painel-padroes');

    grafico.setCandles(candles);
    painel.setCandles(candles);

    // O painel decide o que mostrar; o grafico sabe desenhar. A ligacao entre
    // os dois e um evento, nao uma referencia direta.
    painel.addEventListener('padroes-alterados', (evento) => {
      grafico.setMarcadores(evento.detail.marcadores);
    });

    this.carregarCarteira(painel);
  }

  /**
   * Busca as series dos demais ativos monitorados, para o modo "carteira" do
   * painel ter amostra de verdade: com 63 candles quase nenhum padrao alcanca
   * o minimo estatistico, e somando ~8 ativos chega-se a ~500.
   *
   * Roda depois de o grafico ja estar na tela e falha em silencio: e recurso
   * extra, nao pode atrasar nem derrubar a visao principal.
   */
  async carregarCarteira(painel) {
    const mesmoContexto =
      this._carteiraCache && this._carteiraRange === this._range && this._carteiraBase === this._base;

    if (mesmoContexto) {
      painel.setCarteira(this._carteiraCache);
      return;
    }

    let ativos;
    try {
      ativos = await listarAtivosMonitorados();
    } catch {
      return;
    }

    const series = await Promise.all(
      (ativos || []).map(async (a) => {
        try {
          const historico = await buscarHistorico(a.simbolo, { range: this._range });
          return { simbolo: a.simbolo, candles: comBase(extrairCandles(historico), this._base) };
        } catch {
          return null;
        }
      }),
    );

    this._carteiraCache = series.filter((s) => s && s.candles.length > 0);
    this._carteiraRange = this._range;
    this._carteiraBase = this._base;
    painel.setCarteira(this._carteiraCache);
  }

  templateFixo(candles) {
    const ajustados = candles.filter(
      (c) => c.fatorAjuste && Math.abs(c.fatorAjuste - 1) > 1e-6,
    ).length;

    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h6 class="mb-0">
          ${this._simbolo} — ${rotuloRange(this._range)}
          <span class="text-muted fw-normal">(${candles.length} candle${candles.length === 1 ? '' : 's'})</span>
        </h6>
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div class="btn-group" role="group" aria-label="Range do grafico">
            ${RANGES_DISPONIVEIS.map(
              (r) =>
                `<button type="button" class="btn btn-outline-primary btn-sm ${r.valor === this._range ? 'active' : ''}" data-range="${r.valor}">${r.rotulo}</button>`,
            ).join('')}
          </div>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" role="switch" id="base-preco"
                   ${this._base === 'ajustado' ? 'checked' : ''}>
            <label class="form-check-label small" for="base-preco">Preco ajustado</label>
          </div>
        </div>
      </div>
      ${this.avisoBase(ajustados, candles.length)}
      <candle-chart></candle-chart>
    `;
  }

  /**
   * Diz quantas velas o ajuste mexeu. E a armadilha do preco nao ajustado
   * ficando visivel: desligue o switch e os gaps de provento reaparecem.
   */
  avisoBase(ajustados, total) {
    if (this._base !== 'ajustado') {
      return `
        <p class="small text-danger mb-1 mt-1">
          Preco <strong>bruto</strong>: dividendos e desdobramentos aparecem como gap de baixa,
          sem que ninguem tenha vendido. Serve para ver a armadilha, nao para analisar.
        </p>`;
    }
    if (!ajustados) {
      return '<p class="small text-muted mb-1 mt-1">Nenhuma vela precisou de ajuste nesta janela.</p>';
    }
    return `
      <p class="small text-muted mb-1 mt-1">
        Preco ajustado por proventos — ${ajustados} de ${total} velas tiveram valor corrigido.
        Desligue o switch para ver os gaps que o preco bruto cria.
      </p>`;
  }
}

function rotuloRange(valor) {
  return RANGES_DISPONIVEIS.find((r) => r.valor === valor)?.rotulo || valor;
}

customElements.define('candles-page', CandlesPage);
