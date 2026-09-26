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
// Layout: a partir de telas grandes, o painel de padroes vira um menu lateral
// a esquerda, preso na tela e com rolagem propria (cabecalho fixo, cartoes
// rolando); o grafico ocupa o resto a direita. Abaixo disso as colunas
// empilham - grafico primeiro, padroes depois - e nada fica preso, para nao
// consumir a area util do celular.
export class CandlesPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Velas (candles)</h4>
      <p class="text-muted small">
        Gráfico de velas com o histórico diário de abertura, máxima, mínima e fechamento já
        coletado pelo ecossistema. Ative os padrões no painel lateral (abaixo do gráfico, no
        celular); o significado de cada um está em <a href="#/padroes">Padrões e armadilhas</a>.
      </p>

      <seletor-de-ativos rotulo-botao="Ver candles" placeholder="Ex.: PETR4"></seletor-de-ativos>

      <div id="candles-erro"></div>

      <div class="row g-3 mt-1">
        <div id="candles-grafico" class="col-lg order-lg-2 pt-2 pb-2"></div>
        <aside id="candles-padroes" class="candles-lateral col-lg-4 order-lg-1"
               aria-label="Padrões sobre o gráfico"></aside>
      </div>
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

    const areaGrafico = this.querySelector('#candles-grafico');
    const areaPadroes = this.querySelector('#candles-padroes');
    const erro = this.querySelector('#candles-erro');

    erro.innerHTML = '';
    areaGrafico.innerHTML = '<loading-spinner></loading-spinner>';
    areaPadroes.innerHTML = '';

    let candles;
    try {
      const historico = await buscarHistorico(this._simbolo, { range: this._range });
      candles = comBase(extrairCandles(historico), this._base);
    } catch (e) {
      areaGrafico.innerHTML = '';
      erro.innerHTML = `<status-alert mensagem="${e.message}" variante="danger"></status-alert>`;
      return;
    }

    areaGrafico.innerHTML = this.templateGrafico(candles);
    areaPadroes.innerHTML = '<painel-padroes></painel-padroes>';

    const grafico = areaGrafico.querySelector('candle-chart');
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

  templateGrafico(candles) {
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
          <div class="btn-group" role="group" aria-label="Período do gráfico">
            ${RANGES_DISPONIVEIS.map(
              (r) =>
                `<button type="button" class="btn btn-outline-primary btn-sm ${r.valor === this._range ? 'active' : ''}" data-range="${r.valor}">${r.rotulo}</button>`,
            ).join('')}
          </div>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" role="switch" id="base-preco"
                   ${this._base === 'ajustado' ? 'checked' : ''}>
            <label class="form-check-label small" for="base-preco">Preço ajustado</label>
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
          Preço <strong>bruto</strong>: dividendos e desdobramentos aparecem como lacunas de baixa,
          sem que ninguém tenha vendido. Serve para demonstrar a armadilha, não para analisar.
        </p>`;
    }
    if (!ajustados) {
      return '<p class="small text-muted mb-1 mt-1">Nenhuma vela precisou de ajuste neste período.</p>';
    }
    return `
      <p class="small text-muted mb-1 mt-1">
        Preço ajustado por proventos — ${ajustados} de ${total} velas tiveram o valor corrigido.
        Desative a opção para ver as lacunas que o preço bruto cria.
      </p>`;
  }
}

function rotuloRange(valor) {
  return RANGES_DISPONIVEIS.find((r) => r.valor === valor)?.rotulo || valor;
}

customElements.define('candles-page', CandlesPage);
