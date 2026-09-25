import { BaseComponent } from './base/BaseComponent.js';
import { badgeClassParaRecomendacao } from '../utils/recomendacaoBadge.js';

// Unica responsabilidade: renderizar a lista de ativos monitorados
// (contrato de GET /ativos/registrados), enriquecida com a ultima decisao
// consolidada de cada ativo (contrato de GET /analises/{simbolo}/analise,
// ja usado na tela de consulta) para dar contexto de decisao direto na lista.
export class AtivosMonitoradosTable extends BaseComponent {
  setAtivos(ativos) {
    this._ativos = ativos || [];
    this._analisesPorSimbolo = {};
    this.innerHTML = this.template();
  }

  setAnalise(simbolo, analise) {
    this._analisesPorSimbolo[simbolo] = analise;
    this.innerHTML = this.template();
  }

  template() {
    if (!this._ativos || this._ativos.length === 0) {
      return '<p class="text-muted">Nenhum ativo monitorado ainda.</p>';
    }

    const linhas = this._ativos.map((a) => this.linha(a)).join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-striped align-middle">
          <thead>
            <tr>
              <th>Simbolo</th>
              <th>Status</th>
              <th>Coleta</th>
              <th>Intervalo</th>
              <th>Ultima atualizacao</th>
              <th>Decisao</th>
              <th>Confianca</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
  }

  linha(a) {
    return `
      <tr>
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
  }

  celulaDecisao(simbolo) {
    const analise = this._analisesPorSimbolo[simbolo];

    if (analise === undefined) {
      return '<td colspan="2"><span class="spinner-border spinner-border-sm text-secondary" role="status"></span></td>';
    }

    if (!analise || !analise.recomendacao) {
      return '<td colspan="2" class="text-muted small">Sem analise ainda</td>';
    }

    const badge = badgeClassParaRecomendacao(analise.recomendacao);
    return `
      <td><span class="badge ${badge}">${analise.recomendacao}</span></td>
      <td>${formatarConfianca(analise.confianca_analise)}</td>
    `;
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
