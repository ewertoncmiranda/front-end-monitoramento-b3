import { BaseComponent } from '../components/base/BaseComponent.js';
import { registrarAtivo } from '../api/ativosApi.js';
import '../components/AtivoSearchForm.js';
import '../components/CarteiraResumo.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a tela de cadastro (registro de ativo
// no agendador do gestor-ativos-brutos).
export class CadastroPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Cadastro de ativo</h4>
      <p class="text-muted small">O ativo entra em monitoramento recorrente (cotação + histórico a cada 30s). Acompanhe em <a href="#/monitorados">Monitorados</a>.</p>
      <ativo-search-form rotulo-botao="Cadastrar" placeholder="Ex.: VALE3"></ativo-search-form>
      <carteira-resumo class="d-block mt-2"></carteira-resumo>
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
        resultado.innerHTML = `<status-alert mensagem='${simbolo} registrado com sucesso. Ver em <a href="#/monitorados">Monitorados</a>.' variante="success"></status-alert>`;
        // A carteira acabou de mudar; recarrega para o usuario ver o novo ativo
        this.querySelector('carteira-resumo').carregar();
      } catch (erro) {
        resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
      }
    });
  }
}

customElements.define('cadastro-page', CadastroPage);
