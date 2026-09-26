import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarSetores } from '../api/setoresApi.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Unica responsabilidade: orquestrar a visao "Mercado por setor" - busca o
// universo de referencia agrupado por setor (curado manualmente no backend,
// SetoresReferencia.java) e delega a renderizacao aos cartoes por setor.
export class SetoresPage extends BaseComponent {
  template() {
    return `
      <h4 class="mb-1">Mercado por setor</h4>
      <p class="text-muted small">
        Universo de referencia curado manualmente (nao vem de um indice oficial da B3) - os
        papeis mais liquidos de cada setor, pra dar contexto de comparacao que um unico ativo
        isolado nao tem. Cotacao atualizada a cada hora pelo backend.
      </p>
      <div id="setores-conteudo"><loading-spinner></loading-spinner></div>
    `;
  }

  afterRender() {
    this.carregar();
  }

  async carregar() {
    const area = this.querySelector('#setores-conteudo');
    try {
      const setores = await listarSetores();
      area.innerHTML = `
        <div class="row row-cols-1 row-cols-lg-2 g-3">
          ${setores.map((setor) => renderSetor(setor)).join('')}
        </div>
      `;
    } catch (erro) {
      area.innerHTML = `<status-alert mensagem="${erro.message}" variante="danger"></status-alert>`;
    }
  }
}

function renderSetor(setor) {
  const linhas = setor.ativos.map((ativo) => renderAtivo(ativo)).join('');
  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-header"><strong>${setor.nome}</strong></div>
        <div class="card-body p-0">
          <table class="table table-sm table-hover mb-0">
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAtivo(ativo) {
  const variacao = ativo.variacaoPercent;
  const classe = variacao == null ? 'text-muted' : variacao >= 0 ? 'text-success' : 'text-danger';
  const variacaoTexto = variacao == null ? 'sem cotacao ainda' : `${variacao >= 0 ? '+' : ''}${Number(variacao).toFixed(2)}%`;
  const precoTexto = ativo.preco == null ? '-' : `R$ ${Number(ativo.preco).toFixed(2)}`;
  return `
    <tr>
      <td class="fw-semibold ps-3">${ativo.simbolo}</td>
      <td class="text-end">${precoTexto}</td>
      <td class="text-end pe-3 ${classe}">${variacaoTexto}</td>
    </tr>
  `;
}

customElements.define('setores-page', SetoresPage);
