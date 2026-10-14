import { BaseComponent } from '../base/BaseComponent.js';
import {
  RANGES_DISPONIVEIS,
  buscarHistorico,
  comBase,
  extrairCandles,
} from '../../api/historicoApi.js';
import {
  INTERVALOS,
  RANGES_DO_BANCO,
  buscarPregoes,
  inicioDoRange,
  rangeDoBanco,
  velasDoBanco,
} from '../../api/pregoesApi.js';
import { buscarComunicadosDoPeriodo } from '../../api/comunicadosApi.js';
import {
  agruparPorCandle,
  marcadoresDeComunicados,
} from '../../analise/comunicadosPorCandle.js';
import { formatarData } from '../ComunicadoItem.js';
import { renderNoticiasDoCandle } from '../NoticiasDoCandle.js';
import { escaparHtml } from '../../utils/html.js';
import '../CandleChart.js';
import '../PainelPadroes.js';
import '../PainelTecnico.js';
import '../LoadingSpinner.js';
import '../StatusAlert.js';

const RANGE_PADRAO = '1mo';
const BASE_PADRAO = 'ajustado';

/**
 * F360-PAI-4: Painel de velas reutilizável
 * Reúne candle-chart, painel-padroes, painel-tecnico e notícias do candle.
 * Pode ser usado na ficha de ativo e na página de candles.
 */
export class PainelCandles extends BaseComponent {
  constructor() {
    super();
    this._simbolo = null;
    this._range = RANGE_PADRAO;
    this._base = BASE_PADRAO;
    this._intervalo = 'dia';
    this._pregoes = null;
    this._candles = [];
    this._comunicados = null;
    this._dataAberta = null;
    this._requisicaoComunicados = 0;
    this._requisicaoVelas = 0;
  }

  static get observedAttributes() {
    return ['simbolo'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'simbolo' && oldValue !== newValue) {
      this._simbolo = newValue;
      if (this.isConnected) this.carregar();
    }
  }

  connectedCallback() {
    this._simbolo = this.getAttribute('simbolo') || null;
    super.connectedCallback();
    this.carregar();
  }

  template() {
    return `
      <div id="painel-candles-erro"></div>
      <div class="row g-3 mt-1">
        <div id="painel-candles-grafico" class="col-lg order-lg-2 pt-2 pb-2"></div>
        <aside class="painel-candles-lateral col-lg-4 order-lg-1" aria-label="Painéis laterais">
          <ul class="nav nav-tabs nav-fill mb-0" id="painel-candles-abas" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active small px-2" id="tab-velas" data-bs-toggle="tab"
                      data-bs-target="#painel-velas" type="button" role="tab">
                🕯 Padrões de velas
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link small px-2" id="tab-tecnico" data-bs-toggle="tab"
                      data-bs-target="#painel-tecnico-tab" type="button" role="tab">
                📐 Técnico
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link small px-2" id="tab-noticias" data-bs-toggle="tab"
                      data-bs-target="#painel-noticias-tab" type="button" role="tab">
                📰 Notícias <span id="badge-noticias" class="badge text-bg-secondary ms-1" style="display:none"></span>
              </button>
            </li>
          </ul>
          <div class="tab-content border border-top-0 rounded-bottom p-0" id="painel-candles-abas-conteudo">
            <div class="tab-pane fade show active" id="painel-velas" role="tabpanel">
              <div id="painel-candles-padroes" class="painel-candles-lateral-inner"></div>
            </div>
            <div class="tab-pane fade" id="painel-tecnico-tab" role="tabpanel">
              <div id="painel-candles-tecnico" class="painel-candles-lateral-inner"></div>
            </div>
            <div class="tab-pane fade" id="painel-noticias-tab" role="tabpanel">
              <div id="painel-candles-noticias-painel" class="painel-candles-lateral-inner p-3">
                <p class="small text-muted">Clique em uma vela no gráfico para ver os comunicados da CVM daquele dia.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  afterRender() {
    this.addEventListener('candle-clicado', (evento) => {
      this.abrirNoticias(evento.detail.dataIso);
    });

    // Delegação: os controles são recriados a cada render do bloco fixo.
    this.addEventListener('click', (evento) => {
      const botaoRange = evento.target.closest('[data-range]');
      if (botaoRange && botaoRange.dataset.range !== this._range) {
        this._range = botaoRange.dataset.range;
        const doBanco = rangeDoBanco(this._range);
        this._intervalo = doBanco ? doBanco.intervalo : 'dia';
        this.carregar();
        return;
      }
      const botaoIntervalo = evento.target.closest('[data-intervalo]');
      if (botaoIntervalo && botaoIntervalo.dataset.intervalo !== this._intervalo) {
        this._intervalo = botaoIntervalo.dataset.intervalo;
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
    const requisicao = ++this._requisicaoVelas;

    const areaGrafico = this.querySelector('#painel-candles-grafico');
    const areaPadroes = this.querySelector('#painel-candles-padroes');
    const erro = this.querySelector('#painel-candles-erro');

    erro.innerHTML = '';
    areaGrafico.innerHTML = '<loading-spinner></loading-spinner>';
    areaPadroes.innerHTML = '';
    this.querySelector('#painel-candles-tecnico').innerHTML = '';
    this.querySelector('#painel-candles-noticias-painel').innerHTML =
      '<p class="small text-muted p-3">Clique em uma vela no gráfico para ver os comunicados da CVM daquele dia.</p>';
    this.fecharNoticias();

    let candles;
    try {
      ({ candles, pregoes: this._pregoes } = await this.buscarVelas(this._simbolo));
    } catch (e) {
      if (requisicao !== this._requisicaoVelas || !this.isConnected) return;
      areaGrafico.innerHTML = '';
      erro.innerHTML = `<status-alert mensagem="${escaparHtml(e.message || 'Não foi possível carregar o gráfico.') }" variante="danger"></status-alert>`;
      return;
    }
    if (requisicao !== this._requisicaoVelas || !this.isConnected) return;

    const areaTecnico = this.querySelector('#painel-candles-tecnico');

    areaGrafico.innerHTML = this.templateGrafico(candles);
    areaPadroes.innerHTML = '<painel-padroes></painel-padroes>';
    areaTecnico.innerHTML = '<painel-tecnico></painel-tecnico>';

    const grafico = areaGrafico.querySelector('candle-chart');
    const painel = areaPadroes.querySelector('painel-padroes');
    const tecnico = areaTecnico.querySelector('painel-tecnico');

    grafico.setCandles(candles);
    painel.setCandles(candles);
    tecnico.setCandles(candles);

    painel.addEventListener('padroes-alterados', (evento) => {
      grafico.setMarcadores(evento.detail.marcadores);
    });

    tecnico.addEventListener('tecnico-alterado', (evento) => {
      grafico.setLinhas(evento.detail.linhas);
      grafico.setMarcadoresTecnico(evento.detail.marcadores);
    });

    this._candles = candles;
    this.carregarComunicados(grafico, candles);
  }

  async buscarVelas(simbolo) {
    if (rangeDoBanco(this._range)) {
      const pregoes = await buscarPregoes(simbolo, {
        de: inicioDoRange(this._range),
        intervalo: this._intervalo,
      });
      return { candles: velasDoBanco(pregoes), pregoes };
    }
    const historico = await buscarHistorico(simbolo, { range: this._range });
    return { candles: comBase(extrairCandles(historico), this._base), pregoes: null };
  }

  async carregarComunicados(grafico, candles) {
    if (!candles.length) return;
    const requisicao = ++this._requisicaoComunicados;
    const simbolo = this._simbolo;
    this._comunicados = { carregando: true };

    let estado;
    try {
      const resultado = await buscarComunicadosDoPeriodo(simbolo, {
        desde: candles[0].dataIso,
        ate: candles[candles.length - 1].dataIso,
      });
      estado = { ...resultado, grupos: agruparPorCandle(candles, resultado.comunicados) };
    } catch (erro) {
      estado = { erro: erro.message };
    }
    if (requisicao !== this._requisicaoComunicados) return;

    this._comunicados = estado;
    if (estado.grupos) {
      grafico.setMarcadoresComunicados(marcadoresDeComunicados(candles, estado.grupos));
      const total = [...estado.grupos.values()].reduce((s, g) => s + (g?.length || 0), 0);
      const badge = this.querySelector('#badge-noticias');
      if (badge && total > 0) { badge.textContent = total; badge.style.display = ''; }
    }
    if (this._dataAberta) this.renderizarNoticias(this._dataAberta);
  }

  abrirNoticias(dataIso) {
    if (!this._candles.some((c) => c.dataIso === dataIso)) return;
    this._dataAberta = dataIso;
    this.renderizarNoticias(dataIso);
    const tabBtn = this.querySelector('#tab-noticias');
    if (tabBtn && window.bootstrap) window.bootstrap.Tab.getOrCreateInstance(tabBtn).show();
  }

  renderizarNoticias(dataIso) {
    const indice = this._candles.findIndex((c) => c.dataIso === dataIso);
    if (indice < 0) return;
    const estado = this._comunicados || {};
    const painel = this.querySelector('#painel-candles-noticias-painel');
    if (!painel) return;

    painel.innerHTML = `
      <div class="border-bottom pb-2 mb-3">
        <strong>${escaparHtml(this._simbolo)}</strong>
        <span class="text-muted small ms-1">· ${formatarData(dataIso)}</span>
        <div class="small text-muted">Comunicados oficiais da CVM</div>
      </div>
      ${renderNoticiasDoCandle({
        simbolo: this._simbolo,
        candle: this._candles[indice],
        candleAnterior: indice > 0 ? this._candles[indice - 1] : null,
        grupo: estado.grupos ? estado.grupos.get(dataIso) : null,
        carregando: Boolean(estado.carregando),
        erro: estado.erro || null,
        dadosAte: estado.dadosAte || null,
        fonte: estado.fonte || null,
        aviso: estado.aviso || null,
      })}`;
  }

  fecharNoticias() {
    this._dataAberta = null;
  }

  disconnectedCallback() {
    this._dataAberta = null;
    this._requisicaoVelas++;
    this._requisicaoComunicados++;
  }

  templateGrafico(candles) {
    const ajustados = candles.filter(
      (c) => c.fatorAjuste && Math.abs(c.fatorAjuste - 1) > 1e-6,
    ).length;

    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h6 class="mb-0">
          ${escaparHtml(this._pregoes ? this._pregoes.simbolo : this._simbolo)} — ${rotuloRange(this._range)}
          <span class="text-muted fw-normal">(${candles.length} vela${candles.length === 1 ? '' : 's'}${this._pregoes ? ` de ${rotuloIntervalo(this._intervalo).toLowerCase()}` : ''})</span>
        </h6>
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div class="btn-group flex-wrap" role="group" aria-label="Período do gráfico">
            ${[...RANGES_DISPONIVEIS, ...RANGES_DO_BANCO].map(
              (r) =>
                `<button type="button" class="btn btn-outline-primary btn-sm ${r.valor === this._range ? 'active' : ''}" data-range="${r.valor}">${r.rotulo}</button>`,
            ).join('')}
          </div>
          ${this._pregoes ? `
          <div class="btn-group" role="group" aria-label="Intervalo de cada vela">
            ${INTERVALOS.map(
              (i) =>
                `<button type="button" class="btn btn-outline-secondary btn-sm ${i.valor === this._intervalo ? 'active' : ''}" data-intervalo="${i.valor}">${i.rotulo}</button>`,
            ).join('')}
          </div>` : `
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" role="switch" id="base-preco"
                   ${this._base === 'ajustado' ? 'checked' : ''}>
            <label class="form-check-label small" for="base-preco">Preço ajustado</label>
          </div>`}
        </div>
      </div>
      ${this._pregoes ? this.avisoBanco(this._pregoes) : this.avisoBase(ajustados, candles.length)}
      <p class="small text-muted mb-1">
        Clique numa vela para ver os comunicados da CVM do dia.
        <span class="text-danger" aria-hidden="true">●</span> fato relevante
        <span class="text-primary ms-2" aria-hidden="true">●</span> outros comunicados
      </p>
      <candle-chart></candle-chart>
    `;
  }

  avisoBanco(pregoes) {
    const r = pregoes.resumo;
    if (!r || !r.pregoes) {
      return '<p class="small text-warning mb-1 mt-1">Sem pregões no banco para este período.</p>';
    }
    const reais = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
    const pct = (v) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1).replace('.', ',')}%`;
    const antigos = pregoes.codigos.length > 1
      ? ` Série emendada com o código antigo (${pregoes.codigos.slice(1).map(escaparHtml).join(', ')}).`
      : '';
    const saltos = pregoes.saltos.length
      ? `<p class="small text-danger mb-1">
          <strong>${pregoes.saltos.length} salto(s) de desdobramento/grupamento</strong> — degraus no preço
          bruto, não movimento de mercado: ${pregoes.saltos.map((s) => `${formatarData(s.data)} (${pct(s.variacao)})`).join(', ')}.
          Variações que atravessam essas datas não valem.
        </p>`
      : '';
    return `
      <p class="small text-muted mb-1 mt-1">
        ${formatarData(r.primeiroPregao)} a ${formatarData(r.ultimoPregao)} · ${r.pregoes} pregões ·
        abriu a ${reais(r.abertura)} e fechou a ${reais(r.fechamento)} (${pct(r.variacao)}) ·
        máxima ${reais(r.maxima)} em ${formatarData(r.dataMaxima)} · mínima ${reais(r.minima)} em ${formatarData(r.dataMinima)}.
      </p>
      ${saltos}
      <p class="small text-muted mb-1">Preço bruto oficial da B3 (COTAHIST), sem proventos.${antigos}</p>`;
  }

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
  return [...RANGES_DISPONIVEIS, ...RANGES_DO_BANCO].find((r) => r.valor === valor)?.rotulo || valor;
}

function rotuloIntervalo(valor) {
  return { dia: 'Dia', semana: 'Semana', mes: 'Mês' }[valor] || valor;
}

customElements.define('painel-candles', PainelCandles);
