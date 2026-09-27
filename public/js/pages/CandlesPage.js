import { BaseComponent } from '../components/base/BaseComponent.js';
import {
  RANGES_DISPONIVEIS,
  buscarHistorico,
  comBase,
  extrairCandles,
} from '../api/historicoApi.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import {
  INTERVALOS,
  RANGES_DO_BANCO,
  buscarPregoes,
  inicioDoRange,
  rangeDoBanco,
  velasDoBanco,
} from '../api/pregoesApi.js';
import { buscarComunicadosDoPeriodo } from '../api/comunicadosApi.js';
import {
  agruparPorCandle,
  marcadoresDeComunicados,
} from '../analise/comunicadosPorCandle.js';
import { formatarData } from '../components/ComunicadoItem.js';
import { renderNoticiasDoCandle } from '../components/NoticiasDoCandle.js';
import { escaparHtml } from '../utils/html.js';
import '../components/SeletorDeAtivos.js';
import '../components/CandleChart.js';
import '../components/PainelPadroes.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

const RANGE_PADRAO = '1mo';
const BASE_PADRAO = 'ajustado';

// Unica responsabilidade: orquestrar a aba de candles - escolher ativo, range
// e base de preco, e alimentar o grafico e o painel de padroes.
//
// Duas fontes, pelo periodo: ate 3 meses, a BRAPI ao vivo (com preco ajustado
// por proventos); de 6 meses a "desde 2016", o banco (/ativos/{s}/pregoes -
// COTAHIST da B3, preco bruto, velas por dia, semana ou mes, com os
// desdobramentos marcados). Nao decide
// "quantos candles bastam pra desenhar" (isso e do CandleChart) nem detecta
// padrao (isso e do PainelPadroes).
//
// Layout: a partir de telas grandes, o painel de padroes vira um menu lateral
// a esquerda, preso na tela e com rolagem propria (cabecalho fixo, cartoes
// rolando); o grafico ocupa o resto a direita. Abaixo disso as colunas
// empilham - grafico primeiro, padroes depois - e nada fica preso, para nao
// consumir a area util do celular.
//
// Clicar numa vela abre, no lado oposto ao dos padroes, um painel deslizante
// (offcanvas do Bootstrap) com os comunicados da CVM daquele dia. Sem fundo
// escuro e sem travar a rolagem, para dar para clicar em outras velas com ele
// aberto. Os comunicados do periodo inteiro sao buscados uma vez, junto com o
// grafico, e tambem viram marcadores nas velas.
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

      <div id="candles-erro"></div>

      <div class="row g-3 mt-1">
        <div id="candles-grafico" class="col-lg order-lg-2 pt-2 pb-2"></div>
        <aside id="candles-padroes" class="candles-lateral col-lg-4 order-lg-1"
               aria-label="Padrões sobre o gráfico"></aside>
      </div>

      <div class="offcanvas offcanvas-end candles-noticias" tabindex="-1" id="candles-noticias"
           data-bs-backdrop="false" data-bs-scroll="true" aria-labelledby="candles-noticias-titulo">
        <div class="offcanvas-header border-bottom">
          <div>
            <h5 class="offcanvas-title mb-0" id="candles-noticias-titulo"></h5>
            <small class="text-muted">Comunicados oficiais da CVM</small>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
        </div>
        <div class="offcanvas-body" id="candles-noticias-corpo"></div>
      </div>
    `;
  }

  afterRender() {
    this._simbolo = null;
    this._range = RANGE_PADRAO;
    this._base = BASE_PADRAO;
    this._intervalo = 'dia';
    this._pregoes = null;
    this._candles = [];
    this._comunicados = null;
    this._dataAberta = null;
    this._requisicaoComunicados = 0;

    this.addEventListener('candle-clicado', (evento) => {
      this.abrirNoticias(evento.detail.dataIso);
    });

    // Em tela grande o painel empurra a pagina (ver app.css). O grafico se
    // reenquadra sozinho quando a largura muda (ResizeObserver no CandleChart).
    const painelNoticias = this.querySelector('#candles-noticias');
    painelNoticias.addEventListener('show.bs.offcanvas', () => {
      document.body.classList.add('painel-noticias-aberto');
    });
    painelNoticias.addEventListener('hide.bs.offcanvas', () => {
      document.body.classList.remove('painel-noticias-aberto');
    });
    painelNoticias.addEventListener('hidden.bs.offcanvas', () => {
      this._dataAberta = null;
    });

    this.querySelector('seletor-de-ativos').addEventListener('ativo-buscado', (evento) => {
      this._simbolo = evento.detail.simbolo;
      this.carregar();
    });

    // Delegacao: os controles sao recriados a cada render do bloco fixo.
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

    const areaGrafico = this.querySelector('#candles-grafico');
    const areaPadroes = this.querySelector('#candles-padroes');
    const erro = this.querySelector('#candles-erro');

    erro.innerHTML = '';
    areaGrafico.innerHTML = '<loading-spinner></loading-spinner>';
    areaPadroes.innerHTML = '';
    // Vela aberta de outro ativo ou periodo deixaria o painel mentindo.
    this.fecharNoticias();

    let candles;
    try {
      ({ candles, pregoes: this._pregoes } = await this.buscarVelas(this._simbolo));
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

    this._candles = candles;
    this.carregarComunicados(grafico, candles);
    this.carregarCarteira(painel);
  }

  /**
   * Velas do ativo no periodo e intervalo escolhidos, da fonte certa. Devolve
   * tambem a resposta do banco (resumo e saltos) quando e ele a fonte.
   */
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

  /**
   * Busca os comunicados do periodo do grafico numa chamada so, marca as
   * velas que os tem e deixa tudo pronto para o clique. Falha nao derruba o
   * grafico: so deixa as velas sem marcador e o painel explica.
   */
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
    }
    // Clicaram numa vela antes de os dados chegarem: atualiza o que ja esta aberto.
    if (this._dataAberta) this.renderizarNoticias(this._dataAberta);
  }

  abrirNoticias(dataIso) {
    if (!this._candles.some((c) => c.dataIso === dataIso)) return;
    this._dataAberta = dataIso;
    this.renderizarNoticias(dataIso);

    const bootstrap = window.bootstrap;
    const elemento = this.querySelector('#candles-noticias');
    if (bootstrap && elemento) bootstrap.Offcanvas.getOrCreateInstance(elemento).show();
  }

  renderizarNoticias(dataIso) {
    const indice = this._candles.findIndex((c) => c.dataIso === dataIso);
    if (indice < 0) return;
    const estado = this._comunicados || {};

    this.querySelector('#candles-noticias-titulo').innerHTML =
      `${escaparHtml(this._simbolo)} · ${formatarData(dataIso)}`;
    this.querySelector('#candles-noticias-corpo').innerHTML = renderNoticiasDoCandle({
      simbolo: this._simbolo,
      candle: this._candles[indice],
      candleAnterior: indice > 0 ? this._candles[indice - 1] : null,
      grupo: estado.grupos ? estado.grupos.get(dataIso) : null,
      carregando: Boolean(estado.carregando),
      erro: estado.erro || null,
      dadosAte: estado.dadosAte || null,
      fonte: estado.fonte || null,
      aviso: estado.aviso || null,
    });
  }

  fecharNoticias() {
    this._dataAberta = null;
    const elemento = this.querySelector('#candles-noticias');
    const instancia = window.bootstrap && elemento
      ? window.bootstrap.Offcanvas.getInstance(elemento)
      : null;
    if (instancia) instancia.hide();
  }

  disconnectedCallback() {
    // Troca de aba com o painel aberto: o offcanvas vive dentro desta pagina,
    // mas o Bootstrap guarda estado global da instancia - e a margem que o
    // painel abre na pagina ficaria presa nas outras abas.
    document.body.classList.remove('painel-noticias-aberto');
    const elemento = this.querySelector('#candles-noticias');
    const instancia = window.bootstrap && elemento
      ? window.bootstrap.Offcanvas.getInstance(elemento)
      : null;
    if (instancia) instancia.dispose();
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
    const contexto = `${this._range}|${this._base}|${this._intervalo}`;
    const mesmoContexto = this._carteiraCache && this._carteiraContexto === contexto;

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
          const { candles } = await this.buscarVelas(a.simbolo);
          return { simbolo: a.simbolo, candles };
        } catch {
          return null;
        }
      }),
    );

    this._carteiraCache = series.filter((s) => s && s.candles.length > 0);
    this._carteiraContexto = contexto;
    painel.setCarteira(this._carteiraCache);
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

  /**
   * Resumo do periodo (abertura -> fechamento, extremos com data) e os
   * saltos de desdobramento/grupamento: no preco bruto eles viram degraus
   * falsos, e quem olha o grafico precisa saber onde estao.
   */
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
  return [...RANGES_DISPONIVEIS, ...RANGES_DO_BANCO].find((r) => r.valor === valor)?.rotulo || valor;
}

function rotuloIntervalo(valor) {
  return { dia: 'Dia', semana: 'Semana', mes: 'Mês' }[valor] || valor;
}

customElements.define('candles-page', CandlesPage);
