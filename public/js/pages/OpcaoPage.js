import { BaseComponent } from '../components/base/BaseComponent.js';
import { buscarOpcoes } from '../api/opcoesApi.js';
import { escaparHtml } from '../utils/html.js';
import '../components/OpcoesPainel.js';
import '../components/SeletorDeAtivos.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// Extrai o ativo do hash: #/opcoes/PETR4 ou #/opcoes?ativo=PETR4
function ativoDoHash() {
  const [caminho, consulta = ''] = window.location.hash.split('?');
  const doCaminho = decodeURIComponent(caminho.replace(/^#\/opcoes\/?/, ''));
  return (doCaminho || new URLSearchParams(consulta).get('ativo') || '').trim().toUpperCase();
}

// Unica responsabilidade: painel de opcoes de um ativo (TASK-ETL-5).
// Rota #/opcoes/PETR4 ou #/opcoes?ativo=PETR4.
// Permite trocar o vencimento via select populado pela API.
export class OpcaoPage extends BaseComponent {
  template() {
    const ativo = ativoDoHash();
    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 class="mb-0">Painel de opções</h4>
      </div>
      <seletor-de-ativos rotulo-botao="Ver opções" placeholder="Ex.: PETR4"></seletor-de-ativos>
      <div id="opcao-resultado" class="mt-3"></div>
    `;
  }

  afterRender() {
    const seletor = this.querySelector('seletor-de-ativos');
    seletor.addEventListener('ativo-buscado', (e) => this._abrir(e.detail.simbolo));

    const inicial = ativoDoHash();
    if (inicial) {
      seletor.selecionar(inicial);
    }
  }

  async _abrir(simbolo) {
    const resultado = this.querySelector('#opcao-resultado');
    resultado.innerHTML = '<loading-spinner></loading-spinner>';
    history.replaceState(null, '', `#/opcoes/${encodeURIComponent(simbolo)}`);

    try {
      const dados = await buscarOpcoes(simbolo);
      this._renderizar(resultado, simbolo, dados, null);
    } catch (erro) {
      resultado.innerHTML = `<status-alert variante="danger" mensagem="${escaparHtml(erro.message)}"></status-alert>`;
    }
  }

  _renderizar(resultado, simbolo, dados, vencimentoAtual) {
    const vencimentos = dados.vencimentos || [];
    const opcoes = vencimentos.map((v) => {
      const ano = v.slice(0, 4);
      const mes = v.slice(4, 6);
      const rotulo = new Date(`${ano}-${mes}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const sel = v === vencimentoAtual ? 'selected' : '';
      return `<option value="${escaparHtml(v)}" ${sel}>${rotulo}</option>`;
    }).join('');

    resultado.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <span class="fw-semibold">${escaparHtml(simbolo)}</span>
        ${vencimentos.length > 0 ? `
          <label class="small text-muted mb-0" for="opcao-vencimento">Vencimento:</label>
          <select class="form-select form-select-sm w-auto" id="opcao-vencimento">
            <option value="">Mais próximo</option>
            ${opcoes}
          </select>` : ''}
      </div>
      <opcoes-painel></opcoes-painel>
    `;

    const painel = resultado.querySelector('opcoes-painel');
    painel.setDados(dados);

    const sel = resultado.querySelector('#opcao-vencimento');
    if (sel) {
      sel.addEventListener('change', async () => {
        painel.innerHTML = '<loading-spinner></loading-spinner>';
        try {
          const novos = await buscarOpcoes(simbolo, sel.value || undefined);
          painel.setDados(novos);
        } catch (erro) {
          painel.innerHTML = `<status-alert variante="danger" mensagem="${escaparHtml(erro.message)}"></status-alert>`;
        }
      });
    }
  }
}

customElements.define('opcao-page', OpcaoPage);
