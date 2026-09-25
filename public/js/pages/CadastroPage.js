import { BaseComponent } from '../components/base/BaseComponent.js';
import { registrarAtivo } from '../api/ativosApi.js';
import '../components/AtivoSearchForm.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a tela de cadastro (registro de ativo
// no agendador do gestor-ativos-brutos).
export class CadastroPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Cadastro de ativo</h4>
      <status-alert
        mensagem="O backend ainda nao expoe uma listagem dos ativos registrados: este cadastro so envia o registro, sem confirmar quais ja estao na fila do agendador."
        variante="warning"
      ></status-alert>
      <ativo-search-form rotulo-botao="Cadastrar" placeholder="Ex.: VALE3"></ativo-search-form>
      <div id="cadastro-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    const form = this.querySelector('ativo-search-form');
    const resultado = this.querySelector('#cadastro-resultado');

    form.addEventListener('ativo-buscado', async (event) => {
      const { simbolo } = event.detail;
      resultado.innerHTML = '<loading-spinner></loading-spinner>';

      try {
        await registrarAtivo(simbolo);
        resultado.innerHTML = `<status-alert mensagem="${simbolo} registrado com sucesso." variante="success"></status-alert>`;
      } catch (erro) {
        resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
      }
    });
  }
}

customElements.define('cadastro-page', CadastroPage);
