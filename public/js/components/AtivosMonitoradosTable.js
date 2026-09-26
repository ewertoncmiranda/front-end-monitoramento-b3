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
    this.innerHTML = this.template();
    this.addEventListener('click', (evento) => this.aoClicarLinha(evento));
  }

  setAtivos(ativos) {
    this._ativos = ativos || [];
    this.renderizar();
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

    const linhas = this._ativos.map((a) => this.linhas(a)).join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-striped align-middle">
          <thead>
            <tr>
              <th></th>
              <th>Simbolo</th>
              <th>Status</th>
              <th>Coleta</th>
              <th>Intervalo</th>
              <th>Ultima atualizacao</th>
              <th>Decisao</th>
              <th>Confiança</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
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

customElements.define('ativos-monitorados-table', AtivosMonitoradosTable);
