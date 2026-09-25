import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';
import { buscarAnalise } from '../api/analisesApi.js';
import '../components/AtivosMonitoradosTable.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a tela de ativos monitorados - busca a
// lista, delega a renderizacao pra AtivosMonitoradosTable e, em seguida,
// busca a ultima decisao de cada ativo (GET /analises/{simbolo}/analise) pra
// enriquecer a lista sem travar a renderizacao inicial.
export class AtivosMonitoradosPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Ativos monitorados</h4>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btn-atualizar">Atualizar</button>
      </div>
      <p class="text-muted small">Cada ativo cadastrado é reprocessado automaticamente pelo backend a cada 30s.</p>
      <div id="monitorados-resultado"></div>
    `;
  }

  afterRender() {
    this.querySelector('#btn-atualizar').addEventListener('click', () => this.carregar());
    this.carregar();
  }

  async carregar() {
    const resultado = this.querySelector('#monitorados-resultado');
    resultado.innerHTML = '<loading-spinner></loading-spinner>';

    try {
      const ativos = await listarAtivosMonitorados();
      resultado.innerHTML = '<ativos-monitorados-table></ativos-monitorados-table>';
      const tabela = resultado.querySelector('ativos-monitorados-table');
      tabela.setAtivos(ativos);
      this.carregarDecisoes(tabela, ativos);
    } catch (erro) {
      resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }

  carregarDecisoes(tabela, ativos) {
    // Cada busca falha de forma independente: um ativo sem analise ainda
    // nao deve travar nem esconder a decisao dos demais.
    ativos.forEach((a) => {
      buscarAnalise(a.simbolo)
        .catch(() => null)
        .then((analise) => tabela.setAnalise(a.simbolo, analise));
    });
  }
}

customElements.define('ativos-monitorados-page', AtivosMonitoradosPage);
