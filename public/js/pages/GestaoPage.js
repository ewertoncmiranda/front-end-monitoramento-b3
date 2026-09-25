import { BaseComponent } from '../components/base/BaseComponent.js';
import '../pages/ConsultaPage.js';
import '../pages/CadastroPage.js';
import '../pages/MetodologiaPage.js';

// Unica responsabilidade: agrupar Consulta, Cadastro e Como funciona numa so
// aba do menu, pra nao espalhar o fluxo de "lidar com um ativo" em 3 lugares
// diferentes. Nao duplica logica nenhuma: cada aba interna e o proprio
// componente de pagina existente (<consulta-page>, <cadastro-page>,
// <metodologia-page>), so trocando de visibilidade via abas do Bootstrap -
// o visual e o comportamento de cada uma continuam exatamente os mesmos.
export class GestaoPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-3">Gestao de ativos</h4>
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="gestao-tab-consulta" data-bs-toggle="tab" data-bs-target="#gestao-painel-consulta" type="button" role="tab">Consulta</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="gestao-tab-cadastro" data-bs-toggle="tab" data-bs-target="#gestao-painel-cadastro" type="button" role="tab">Cadastro</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="gestao-tab-metodologia" data-bs-toggle="tab" data-bs-target="#gestao-painel-metodologia" type="button" role="tab">Como funciona</button>
        </li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="gestao-painel-consulta" role="tabpanel">
          <consulta-page></consulta-page>
        </div>
        <div class="tab-pane fade" id="gestao-painel-cadastro" role="tabpanel">
          <cadastro-page></cadastro-page>
        </div>
        <div class="tab-pane fade" id="gestao-painel-metodologia" role="tabpanel">
          <metodologia-page></metodologia-page>
        </div>
      </div>
    `;
  }
}

customElements.define('gestao-page', GestaoPage);
