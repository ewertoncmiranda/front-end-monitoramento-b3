import { BaseComponent } from './base/BaseComponent.js';
import { badgeClassParaRecomendacao } from '../utils/recomendacaoBadge.js';
import { buscarCotacaoRobusta } from '../api/ativosApi.js';
import { buscarHistorico, extrairCandles } from '../api/historicoApi.js';
import { buscarFundamentos } from '../api/analisesApi.js';
import './AtivoQuoteCard.js';
import './AnaliseResultCard.js';
import './HistoricoTable.js';
import './FundamentosCard.js';
import './LoadingSpinner.js';

const COLUNAS = 8;

// Unica responsabilidade: renderizar a lista de ativos monitorados
// (contrato de GET /ativos/registrados), enriquecida com a ultima decisao
// consolidada de cada ativo (contrato de GET /analises/{simbolo}/analise,
// ja usado na tela de consulta) para dar contexto de decisao direto na lista.
// Cada linha e clicavel: expande abaixo dela a mesma visao estruturada da
// tela de Consulta (cotacao, decisao, historico), reaproveitando os mesmos
// componentes - sem duplicar renderizacao.
export class AtivosMonitoradosTable extends BaseComponent {
  connectedCallback() {
    this._ativos = [];
    this._analisesPorSimbolo = {};
    this._expandidos = new Set();
    this._detalhesPorSimbolo = {};
    this._ordenacao = { coluna: null, direcao: 1 };
    this.innerHTML = this.template();
    this.addEventListener('click', (evento) => this.aoClicarLinha(evento));
    this.addEventListener('click', (evento) => this.aoClicarCabecalho(evento));
  }

  setAtivos(ativos) {
    this._ativos = ativos || [];
    this.renderizar();
  }

  aoClicarCabecalho(evento) {
    const cabecalho = evento.target.closest('th[data-coluna]');
    if (!cabecalho) {
      return;
    }

    const coluna = cabecalho.dataset.coluna;
    if (this._ordenacao.coluna === coluna) {
      this._ordenacao.direcao *= -1;
    } else {
      this._ordenacao = { coluna, direcao: 1 };
    }
    this.renderizar();
  }

  ativosOrdenados() {
    const { coluna, direcao } = this._ordenacao;
    if (!coluna) {
      return this._ativos;
    }

    const comparador = COMPARADORES[coluna];
    return [...this._ativos].sort((a, b) => direcao * comparador(a, b, this._analisesPorSimbolo));
  }

  setAnalise(simbolo, analise) {
    this._analisesPorSimbolo[simbolo] = analise;
    this.renderizar();
  }

  aoClicarLinha(evento) {
    const linha = evento.target.closest('tr[data-simbolo]');
    if (!linha) {
      return;
    }
    this.alternarExpansao(linha.dataset.simbolo);
  }

  alternarExpansao(simbolo) {
    if (this._expandidos.has(simbolo)) {
      this._expandidos.delete(simbolo);
      this.renderizar();
      return;
    }

    this._expandidos.add(simbolo);
    this.renderizar();

    if (!this._detalhesPorSimbolo[simbolo]) {
      this.carregarDetalhes(simbolo);
    }
  }

  async carregarDetalhes(simbolo) {
    // Mesma chamada (e mesmo efeito colateral ja conhecido de publicar em SQS)
    // que a tela de Consulta usa - cada busca falha de forma independente.
    const [ativo, historico, fundamentos] = await Promise.all([
      buscarCotacaoRobusta(simbolo).catch(() => null),
      buscarHistorico(simbolo).catch(() => null),
      buscarFundamentos(simbolo).catch(() => null),
    ]);
    this._detalhesPorSimbolo[simbolo] = { ativo, historico, fundamentos };
    this.renderizar();
  }

  renderizar() {
    this.innerHTML = this.template();
    this.hidratarLinhasExpandidas();
  }

  template() {
    if (!this._ativos || this._ativos.length === 0) {
      return '<p class="text-muted">Nenhum ativo monitorado ainda.</p>';
    }

    const linhas = this.ativosOrdenados().map((a) => this.linhas(a)).join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-striped align-middle">
          <thead>
            <tr>
              <th></th>
              ${this.th('simbolo', 'Simbolo')}
              ${this.th('status', 'Status')}
              ${this.th('coleta', 'Coleta')}
              ${this.th('intervalo', 'Intervalo')}
              ${this.th('atualizadoEm', 'Ultima atualizacao')}
              ${this.th('decisao', 'Decisao')}
              ${this.th('confianca', 'Confiança')}
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
  }

  th(coluna, rotulo) {
    const ativo = this._ordenacao.coluna === coluna;
    const indicador = ativo ? (this._ordenacao.direcao === 1 ? ' ▲' : ' ▼') : '';
    return `<th data-coluna="${coluna}" style="cursor: pointer;" class="${ativo ? 'table-active' : ''}">${rotulo}${indicador}</th>`;
  }

  linhas(a) {
    const expandido = this._expandidos.has(a.simbolo);
    const linhaPrincipal = `
      <tr data-simbolo="${a.simbolo}" style="cursor: pointer;" class="${expandido ? 'table-active' : ''}">
        <td class="text-muted">${expandido ? '▾' : '▸'}</td>
        <td>${a.simbolo}</td>
        <td>
          <span class="badge ${a.ativo ? 'bg-success' : 'bg-secondary'}">
            ${a.ativo ? 'Ativo' : 'Pausado'}
          </span>
        </td>
        <td>${formatarTipoColeta(a.tipoColeta)}</td>
        <td>${a.intervaloSegundos}s</td>
        <td>${formatarData(a.atualizadoEm)}</td>
        ${this.celulaDecisao(a.simbolo)}
      </tr>
    `;

    return expandido ? linhaPrincipal + this.linhaDetalhe(a.simbolo) : linhaPrincipal;
  }

  linhaDetalhe(simbolo) {
    const detalhes = this._detalhesPorSimbolo[simbolo];
    const conteudo = detalhes
      ? `
        <ativo-quote-card></ativo-quote-card>
        <analise-result-card></analise-result-card>
        <h6 class="mt-3">Historico (1 mes)</h6>
        <historico-table></historico-table>
        <h6 class="mt-3">Fundamentos e calculos (ultimo ciclo)</h6>
        <fundamentos-card></fundamentos-card>
      `
      : '<loading-spinner></loading-spinner>';

    return `
      <tr data-detalhe="${simbolo}">
        <td colspan="${COLUNAS}" class="bg-body-tertiary">${conteudo}</td>
      </tr>
    `;
  }

  celulaDecisao(simbolo) {
    const analise = this._analisesPorSimbolo[simbolo];

    if (analise === undefined) {
      return '<td colspan="2"><span class="spinner-border spinner-border-sm text-secondary" role="status"></span></td>';
    }

    if (!analise || !analise.recomendacao) {
      return '<td colspan="2" class="text-muted small">Sem análise até o momento</td>';
    }

    const badge = badgeClassParaRecomendacao(analise.recomendacao);
    return `
      <td><span class="badge ${badge}">${analise.recomendacao}</span></td>
      <td>${formatarConfianca(analise.confianca_analise)}</td>
    `;
  }

  hidratarLinhasExpandidas() {
    this._expandidos.forEach((simbolo) => {
      const detalhes = this._detalhesPorSimbolo[simbolo];
      if (!detalhes) {
        return;
      }

      const linhaDetalhe = this.querySelector(`tr[data-detalhe="${simbolo}"]`);
      if (!linhaDetalhe) {
        return;
      }

      if (detalhes.ativo) {
        linhaDetalhe.querySelector('ativo-quote-card')?.setAtivo(detalhes.ativo);
      }

      const analise = this._analisesPorSimbolo[simbolo];
      if (analise) {
        linhaDetalhe.querySelector('analise-result-card')?.setAnalise(analise);
      }

      linhaDetalhe.querySelector('historico-table')?.setCandles(extrairCandles(detalhes.historico));

      if (detalhes.fundamentos) {
        linhaDetalhe.querySelector('fundamentos-card')?.setFundamentos(detalhes.fundamentos);
      }
    });
  }
}

function formatarTipoColeta(tipo) {
  return tipo === 'COTACAO_E_HISTORICO' ? 'Cotacao + Historico' : 'Cotacao';
}

function formatarData(valor) {
  if (!valor) {
    return '-';
  }
  return String(valor).replace('T', ' ').slice(0, 19);
}

function formatarConfianca(valor) {
  if (valor === undefined || valor === null) {
    return '-';
  }
  return `${(Number(valor) * 100).toFixed(0)}%`;
}

// Ordem semantica das recomendacoes, da mais otimista pra mais pessimista -
// usada pra ordenar a coluna Decisao por sentido, nao por ordem alfabetica.
const ORDEM_RECOMENDACAO = [
  'COMPRA_FORTE',
  'COMPRA',
  'COMPRA_MODERADA',
  'NEUTRO',
  'MANTER',
  'VENDA',
  'VENDA_VALUATION',
];

function rankRecomendacao(analise) {
  if (!analise || !analise.recomendacao) {
    return ORDEM_RECOMENDACAO.length;
  }
  const indice = ORDEM_RECOMENDACAO.indexOf(analise.recomendacao);
  return indice === -1 ? ORDEM_RECOMENDACAO.length : indice;
}

const COMPARADORES = {
  simbolo: (a, b) => a.simbolo.localeCompare(b.simbolo),
  status: (a, b) => Number(a.ativo) - Number(b.ativo),
  coleta: (a, b) => formatarTipoColeta(a.tipoColeta).localeCompare(formatarTipoColeta(b.tipoColeta)),
  intervalo: (a, b) => a.intervaloSegundos - b.intervaloSegundos,
  atualizadoEm: (a, b) => new Date(a.atualizadoEm || 0) - new Date(b.atualizadoEm || 0),
  decisao: (a, b, analisesPorSimbolo) =>
    rankRecomendacao(analisesPorSimbolo[a.simbolo]) - rankRecomendacao(analisesPorSimbolo[b.simbolo]),
  confianca: (a, b, analisesPorSimbolo) => {
    const confA = analisesPorSimbolo[a.simbolo]?.confianca_analise ?? -1;
    const confB = analisesPorSimbolo[b.simbolo]?.confianca_analise ?? -1;
    return confA - confB;
  },
};

customElements.define('ativos-monitorados-table', AtivosMonitoradosTable);
