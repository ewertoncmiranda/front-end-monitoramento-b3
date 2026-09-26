import { BaseComponent } from './base/BaseComponent.js';
import {
  ALERTAS,
  PADROES,
  PADROES_NAO_DETECTAVEIS,
  detectar,
} from '../analise/detectorPadroes.js';
import {
  HORIZONTE_PADRAO,
  avaliar,
  avaliarCarteira,
  interpretar,
} from '../analise/taxaAcerto.js';

// Unica responsabilidade: deixar ligar e desligar padroes sobre o grafico e
// mostrar o que cada um significa estatisticamente naquela janela.
//
// Nao desenha nada: emite o evento `padroes-alterados` com os marcadores, e
// quem escuta (CandlesPage) repassa pro CandleChart. Mesma separacao entre
// "quem sabe o que mostrar" e "quem sabe desenhar" do resto do app.
//
// A decisao de interface que mais importa aqui: o cartao de cada padrao
// mostra a taxa de acerto SEMPRE ao lado da taxa-base da janela. Taxa
// sozinha engana - e a propria armadilha que a aba Padroes descreve.

const CORES = {
  alta: '#198754',
  baixa: '#dc3545',
  neutro: '#6c757d',
  alerta: '#fd7e14',
};

export class PainelPadroes extends BaseComponent {
  connectedCallback() {
    this._candles = [];
    this._carteira = [];
    this._escopo = 'ativo';
    this._ligados = new Set();
    this._horizonte = HORIZONTE_PADRAO;
    this.innerHTML = this.template();
    this.afterRender();
  }

  setCandles(candles) {
    this._candles = candles || [];
    this.renderizar();
    this.emitirMarcadores();
  }

  /**
   * Series dos demais ativos monitorados, para o modo "carteira".
   * Chegam prontas de fora: o painel nao busca nada.
   */
  setCarteira(series) {
    this._carteira = series || [];
    this.renderizar();
  }

  template() {
    return '<div id="painel-padroes"></div>';
  }

  afterRender() {
    this.addEventListener('click', (evento) => {
      const alvo = evento.target.closest('[data-padrao]');
      if (!alvo) return;
      this.alternar(alvo.dataset.padrao);
    });

    this.addEventListener('change', (evento) => {
      if (evento.target.id === 'horizonte-select') {
        this._horizonte = Number(evento.target.value);
        this.renderizar();
      }
      if (evento.target.id === 'escopo-select') {
        this._escopo = evento.target.value;
        this.renderizar();
      }
    });
  }

  alternar(id) {
    if (this._ligados.has(id)) this._ligados.delete(id);
    else this._ligados.add(id);
    this.renderizar();
    this.emitirMarcadores();
  }

  /** Recalcula os marcadores dos padroes ligados e avisa quem desenha. */
  emitirMarcadores() {
    const marcadores = [];

    [...PADROES, ...ALERTAS].forEach((definicao) => {
      if (!this._ligados.has(definicao.id)) return;
      const ehAlerta = ALERTAS.includes(definicao);
      const cor = ehAlerta ? CORES.alerta : CORES[definicao.direcao];

      detectar(this._candles, definicao).forEach((i) => {
        marcadores.push({
          dataIso: this._candles[i].dataIso,
          posicao: definicao.direcao === 'alta' ? 'abaixo' : 'acima',
          cor,
          texto: definicao.nome,
        });
      });
    });

    this.dispatchEvent(
      new CustomEvent('padroes-alterados', { detail: { marcadores }, bubbles: true }),
    );
  }

  renderizar() {
    const area = this.querySelector('#painel-padroes');
    if (!area) return;

    if (this._candles.length === 0) {
      area.innerHTML = '';
      return;
    }

    area.innerHTML = `
      ${this.cabecalho()}
      <div class="padroes-cartoes-scroll">
        <div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
          ${PADROES.map((p) => this.cartao(p, false)).join('')}
        </div>

        <h6 class="mt-4">Alertas: armadilhas visiveis no proprio candle</h6>
        <p class="small text-muted">
          Não são sinais de operação. São avisos de que aquela vela pode não significar
          o que parece. Cada um corresponde a uma armadilha da aba
          <a href="#/padroes">Padrões</a>.
        </p>
        <div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
          ${ALERTAS.map((a) => this.cartao(a, true)).join('')}
        </div>

        ${this.naoDetectaveis()}
      </div>
    `;
  }

  cabecalho() {
    const opcoes = [1, 3, 5, 10]
      .map(
        (h) =>
          `<option value="${h}" ${h === this._horizonte ? 'selected' : ''}>${h} pregão(ões)</option>`,
      )
      .join('');

    return `
      <div class="bg-body py-2 border-bottom mb-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h6 class="mb-0">Padrões sobre o gráfico</h6>
          <div class="d-flex align-items-center gap-2 flex-wrap">
          <label class="small text-muted" for="escopo-select">Estatística sobre</label>
          <select id="escopo-select" class="form-select form-select-sm" style="width:auto">
            <option value="ativo" ${this._escopo === 'ativo' ? 'selected' : ''}>
              este ativo (${this._candles.length} candles)
            </option>
            <option value="carteira" ${this._escopo === 'carteira' ? 'selected' : ''}>
              carteira inteira (${this.totalCandlesCarteira()} velas)
            </option>
          </select>
          <label class="small text-muted" for="horizonte-select">Julgar acerto em</label>
          <select id="horizonte-select" class="form-select form-select-sm" style="width:auto">
            ${opcoes}
          </select>
          </div>
        </div>
        <p class="small text-muted">
          Clique para desenhar no gráfico. A taxa de acerto aparece <strong>sempre</strong> ao lado
          da taxa-base do período: se o ativo subiu em 55% dos pregões, um padrão de alta com
          58% não acrescenta informação.
        </p>
        <div class="alert alert-warning small py-2 mb-0">
          <strong>Calibragem.</strong> Cada cartão mostra quantas vezes o padrão aparece em uma
          série <em>aleatória</em> do mesmo tamanho. Executamos o detector em 20 passeios
          aleatórios de 63 velas: o harami apareceu 16 vezes por série (uma a cada quatro velas),
          e a estrela da manhã chegou a exibir <strong>12 pontos de vantagem sobre a base em
          ruído puro</strong>. Se a contagem real não for muito diferente da observada no ruído,
          encontrar o padrão não acrescenta informação.
        </div>
      </div>
    `;
  }

  cartao(definicao, ehAlerta) {
    const ligado = this._ligados.has(definicao.id);
    const ocorrencias = detectar(this._candles, definicao);
    const naCarteira = this._escopo === 'carteira' && this._carteira.length > 0;
    const totalCarteira = naCarteira
      ? this._carteira.reduce((soma, s) => soma + detectar(s.candles, definicao).length, 0)
      : null;

    const corpoEstatistica = ehAlerta
      ? this.corpoAlerta(definicao, ocorrencias)
      : this.corpoEstatistica(definicao, ocorrencias);

    return `
      <div class="col">
        <div class="card h-100 ${ligado ? 'border-primary' : ''}">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <button type="button"
                        class="btn btn-sm ${ligado ? 'btn-primary' : 'btn-outline-secondary'}"
                        data-padrao="${definicao.id}">
                  ${ligado ? '✓ ' : ''}${definicao.nome}
                </button>
                ${
                  !ehAlerta
                    ? `<span class="badge bg-light text-dark ms-1">${definicao.direcao}</span>`
                    : ''
                }
              </div>
              <span class="text-end">
                <span class="badge bg-secondary">${ocorrencias.length}x aqui</span>
                ${
                  naCarteira
                    ? `<div class="small text-muted mt-1">${totalCarteira}x na carteira</div>`
                    : ''
                }
                ${
                  definicao.ruidoPorJanela !== undefined
                    ? `<div class="small text-muted mt-1" title="Média em 20 séries aleatórias de 63 velas">~${definicao.ruidoPorJanela}x no ruído</div>`
                    : ''
                }
              </span>
            </div>
            <p class="small text-muted mb-1 mt-2">${definicao.resumo}</p>
            <p class="small text-muted mb-2"><code>${definicao.regra}</code></p>
            ${corpoEstatistica}
          </div>
        </div>
      </div>
    `;
  }

  totalCandlesCarteira() {
    return this._carteira.reduce((soma, s) => soma + (s.candles?.length || 0), 0);
  }

  corpoEstatistica(definicao, ocorrencias) {
    const naCarteira = this._escopo === 'carteira' && this._carteira.length > 0;
    const resultado = naCarteira
      ? avaliarCarteira(this._carteira, definicao, detectar, this._horizonte)
      : avaliar(this._candles, ocorrencias, definicao.direcao, this._horizonte);
    const leitura = interpretar(resultado);

    const numeros =
      resultado.avaliavel && resultado.amostraSuficiente
        ? `
          <div class="d-flex flex-wrap gap-3 small mb-1">
            <span><span class="text-muted">Acerto:</span> <strong>${resultado.taxa.toFixed(1)}%</strong></span>
            <span><span class="text-muted">Taxa-base:</span> ${resultado.taxaBase.toFixed(1)}%</span>
            <span><span class="text-muted">Vantagem:</span>
              <strong class="${resultado.vantagem >= 0 ? 'text-success' : 'text-danger'}">
                ${resultado.vantagem >= 0 ? '+' : ''}${resultado.vantagem.toFixed(1)} pts
              </strong>
            </span>
            <span class="text-muted">n=${resultado.julgaveis}</span>
          </div>`
        : '';

    return `
      <span class="badge ${leitura.classe}">${leitura.rotulo}</span>
      ${numeros}
      <p class="small text-muted mb-0 mt-1">${leitura.texto}</p>
      ${
        naCarteira
          ? `<p class="small text-muted mb-0"><em>Somando ${resultado.ativos} ativo(s) monitorado(s). Os contadores são somados; as séries nunca são concatenadas, para não criar um salto artificial na junção.</em></p>`
          : ''
      }
      ${
        resultado.descartadas
          ? `<p class="small text-muted mb-0"><em>${resultado.descartadas} ocorrência(s) sem ${this._horizonte} pregão(ões) posterior(es) para avaliar.</em></p>`
          : ''
      }
      ${
        resultado.sobrepostas
          ? `<p class="small text-muted mb-0"><em>${resultado.sobrepostas} ocorrência(s) descartada(s) por sobreposição: estavam a menos de ${this._horizonte} pregão(ões) de outra e compartilhariam o mesmo período futuro.</em></p>`
          : ''
      }
    `;
  }

  corpoAlerta(definicao, ocorrencias) {
    return `
      <span class="badge bg-warning text-dark">Armadilha</span>
      <p class="small text-muted mb-0 mt-1">
        Relacionado a: <strong>${definicao.armadilha}</strong>.
        ${
          ocorrencias.length
            ? `Encontrado em ${ocorrencias.length} vela(s) desta janela.`
            : 'Nenhuma ocorrencia nesta janela.'
        }
      </p>
    `;
  }

  naoDetectaveis() {
    const itens = PADROES_NAO_DETECTAVEIS.map(
      (p) => `
        <tr>
          <td class="fw-semibold">${p.nome}</td>
          <td class="text-muted small">${p.razao}</td>
        </tr>`,
    ).join('');

    return `
      <div class="card border-secondary">
        <div class="card-header"><strong>Por que estes padrões não são detectados aqui</strong></div>
        <div class="card-body">
          <p class="small text-muted mb-2">
            Não é uma limitação de esforço. São padrões cuja definição depende de julgamento
            humano; automatizá-los produziria um detector que dispara em ruído — a apofenia
            descrita na aba <a href="#/padroes">Padrões</a>.
          </p>
          <div class="table-responsive">
            <table class="table table-sm mb-0"><tbody>${itens}</tbody></table>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('painel-padroes', PainelPadroes);
