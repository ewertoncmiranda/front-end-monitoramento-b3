import { BaseComponent } from './base/BaseComponent.js';
import { listarAtivosMonitorados } from '../api/ativosMonitoradosApi.js';

// Unica responsabilidade: mostrar, so para leitura, quais ativos ja estao
// cadastrados. Diferente do SeletorDeAtivos, aqui os simbolos nao sao
// clicaveis - na tela de cadastro, clicar num ativo ja registrado so
// recadastraria o mesmo, o que nao ajuda ninguem.
//
// Serve para o usuario nao tentar cadastrar algo que ja esta la.
export class CarteiraResumo extends BaseComponent {
  template() {
    return '<div id="carteira-resumo" class="small text-muted">Carregando carteira...</div>';
  }

  afterRender() {
    this.carregar();
  }

  /** Rechamado por quem cadastra um ativo novo, para a lista refletir na hora. */
  async carregar() {
    const area = this.querySelector('#carteira-resumo');

    let ativos;
    try {
      ativos = await listarAtivosMonitorados();
    } catch {
      area.innerHTML = 'Não foi possível carregar a carteira.';
      return;
    }

    if (!ativos || ativos.length === 0) {
      area.innerHTML = 'Nenhum ativo cadastrado ainda.';
      return;
    }

    const badges = ativos
      .map((a) => `<span class="badge bg-secondary">${a.simbolo}</span>`)
      .join(' ');

    area.innerHTML = `
      <div class="d-flex align-items-center flex-wrap gap-1">
        <span>Ja cadastrados (${ativos.length}):</span>
        ${badges}
      </div>
    `;
  }
}

customElements.define('carteira-resumo', CarteiraResumo);
