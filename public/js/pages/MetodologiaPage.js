import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarFundamentos, buscarFundamentosCvm } from '../api/analisesApi.js';
import '../components/AtivoSearchForm.js';
import '../components/FundamentosCard.js';
import '../components/FundamentosCvmCard.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a aba "Como funciona" - a ferramenta
// interativa que busca um simbolo e delega a renderizacao dos fundamentos
// reais pra FundamentosCard. A explicacao das formulas (conteudo estatico)
// mora em FormulasPage; a visao dos 4 componentes do ecossistema, em
// ArquiteturaPage - cada aba com uma unica responsabilidade.
export class MetodologiaPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Como funciona</h4>
      <p class="text-muted small">Mostra o retrato exato da ultima analise persistida de um ativo - os mesmos numeros calculados pelo gerar-insights naquele ciclo, sem media com o historico. Veja as formulas em <a href="#/formulas">Formulas</a> e a arquitetura em <a href="#/arquitetura">Arquitetura</a>.</p>
      <ativo-search-form rotulo-botao="Buscar" placeholder="Ex.: PETR4"></ativo-search-form>
      <div id="fundamentos-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    const form = this.querySelector('ativo-search-form');
    const resultado = this.querySelector('#fundamentos-resultado');

    form.addEventListener('ativo-buscado', async (event) => {
      const { simbolo } = event.detail;
      resultado.innerHTML = '<loading-spinner></loading-spinner>';

      try {
        // Duas fontes independentes: a analise do gerar-insights e os
        // fundamentos contabeis da CVM. Uma falhar nao pode esconder a outra.
        const [fundamentos, fundamentosCvm] = await Promise.all([
          buscarFundamentos(simbolo).catch(() => null),
          buscarFundamentosCvm(simbolo).catch(() => null),
        ]);

        if (!fundamentos && !fundamentosCvm) {
          resultado.innerHTML =
            '<status-alert mensagem="Nao foi possivel obter dados para esse ativo." variante="danger"></status-alert>';
          return;
        }

        resultado.innerHTML = `
          <fundamentos-cvm-card></fundamentos-cvm-card>
          <fundamentos-card></fundamentos-card>
        `;
        resultado.querySelector('fundamentos-cvm-card').setFundamentos(fundamentosCvm);
        resultado.querySelector('fundamentos-card').setFundamentos(fundamentos);
      } catch (erro) {
        resultado.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
      }
    });
  }
}

customElements.define('metodologia-page', MetodologiaPage);
