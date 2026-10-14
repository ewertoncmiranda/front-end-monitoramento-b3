import { BaseComponent } from '../components/base/BaseComponent.js';
import '../pages/ConsultaPage.js';

// Unica responsabilidade: a rota #/gestao - a ficha classica (<consulta-page>).
// Sem aba Cadastro: todos os ativos ja estao no banco, e favoritar (o unico
// efeito do antigo cadastro) e a estrela da propria ficha. Links com simbolo
// (#/gestao/PETR4) ja chegam redirecionados para a ficha nova (#/ativo/PETR4).
export class GestaoPage extends BaseComponent {
  template() {
    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 class="mb-0">Ficha do ativo</h4>
        <a class="btn btn-sm btn-outline-primary" href="#/ativo">Abrir a ficha completa ›</a>
      </div>
      <consulta-page></consulta-page>
    `;
  }
}

customElements.define('gestao-page', GestaoPage);
