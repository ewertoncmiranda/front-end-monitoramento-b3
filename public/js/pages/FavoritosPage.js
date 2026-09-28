import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarFavoritos, desfavoritar } from '../api/favoritosApi.js';
import { buscarAnalise } from '../api/analisesApi.js';
import '../components/AtivosMonitoradosTable.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a tela de Favoritos - busca a lista
// (GET /favoritos, so tipoColeta=COTACAO_E_HISTORICO), delega a renderizacao
// pra AtivosMonitoradosTable (com a coluna de remover ligada) e, em seguida,
// busca a ultima decisao de cada ativo pra enriquecer a lista.
//
// Diferente da Base (#/base, universo amplo sem BRAPI) e do antigo
// Monitorados (#/monitorados, que ainda mistura favoritos com referencias de
// setor): aqui e so o que o usuario escolheu acompanhar de perto.
export class FavoritosPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Favoritos</h4>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btn-atualizar">Atualizar</button>
      </div>
      <p class="text-muted small">Cotação intradiária via BRAPI a cada 15 min, só em dia útil das 10h às 18h30. Adicione favoritos na aba <a href="#/base">Base</a>.</p>
      <div id="favoritos-resultado"></div>
    `;
  }

  afterRender() {
    this.querySelector('#btn-atualizar').addEventListener('click', () => this.carregar());
    this.addEventListener('remover-ativo', (evento) => this.remover(evento.detail.simbolo));
    this.carregar();
  }

  async carregar() {
    const resultado = this.querySelector('#favoritos-resultado');
    resultado.innerHTML = '<loading-spinner></loading-spinner>';

    try {
      const favoritos = await listarFavoritos();
      resultado.innerHTML = '<ativos-monitorados-table></ativos-monitorados-table>';
      const tabela = resultado.querySelector('ativos-monitorados-table');
      tabela.mostrarRemover(true);
      tabela.setAtivos(favoritos);
      this.carregarDecisoes(tabela, favoritos);
    } catch (erro) {
      resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }

  carregarDecisoes(tabela, favoritos) {
    // Cada busca falha de forma independente: um ativo sem analise ainda
    // nao deve travar nem esconder a decisao dos demais.
    favoritos.forEach((a) => {
      buscarAnalise(a.simbolo)
        .catch(() => null)
        .then((analise) => tabela.setAnalise(a.simbolo, analise));
    });
  }

  async remover(simbolo) {
    try {
      await desfavoritar(simbolo);
      this.carregar();
    } catch (erro) {
      this.querySelector('#favoritos-resultado').insertAdjacentHTML(
        'afterbegin',
        `<status-alert mensagem="Não foi possível remover ${simbolo}: ${erro.message}" variante="danger"></status-alert>`,
      );
    }
  }
}

customElements.define('favoritos-page', FavoritosPage);
