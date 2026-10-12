import { BaseComponent } from '../components/base/BaseComponent.js';
import { listarAtivosSimulador, registrarAtivoSimulador, desativarAtivoSimulador } from '../api/simuladorApi.js';
import { escaparHtml } from '../utils/html.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// SIM-PAI-1: Página principal do simulador com 4 abas internas

const ABAS = [
  { id: 'estrategias', rotulo: 'Estratégias' },
  { id: 'cenario', rotulo: 'Cenário' },
  { id: 'retroativo', rotulo: 'Retroativo' },
  { id: 'operacoes', rotulo: 'Operações' },
];

export class SimuladorPage extends BaseComponent {
  constructor() {
    super();
    this.abaAtiva = 'estrategias';
    this.ativos = [];
    this.carregando = false;
    this.erro = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.carregarAtivos();
    this.render();
  }

  async carregarAtivos() {
    this.carregando = true;
    this.erro = null;
    this.render();

    try {
      const dados = await listarAtivosSimulador();
      this.ativos = dados || [];
    } catch (e) {
      console.error('Erro ao carregar ativos do simulador:', e);
      this.erro = e.message || 'Erro ao carregar ativos';
    } finally {
      this.carregando = false;
      this.render();
    }
  }

  template() {
    const chips = ABAS.map((a) => `
      <button type="button" class="btn btn-sm ${a.id === this.abaAtiva ? 'btn-primary' : 'btn-outline-primary'}"
        data-aba="${a.id}" aria-pressed="${a.id === this.abaAtiva}">${a.rotulo}</button>`).join('');

    const conteudoAba = this.conteudoAba();

    return `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Simulador de Operações</h4>
        <button type="button" class="btn btn-outline-primary btn-sm" id="btn-atualizar">Atualizar</button>
      </div>
      <p class="text-muted small mb-3">
        Simulação/paper trading; não é recomendação de investimento.
      </p>
      <div class="d-flex gap-2 mb-3" role="group" aria-label="Abas do simulador">${chips}</div>
      ${conteudoAba}
    `;
  }

  conteudoAba() {
    if (this.carregando) {
      return '<loading-spinner></loading-spinner>';
    }

    if (this.erro) {
      return `<status-alert tipo="erro" mensagem="${escaparHtml(this.erro)}"></status-alert>`;
    }

    switch (this.abaAtiva) {
      case 'estrategias':
        return this.abaEstrategias();
      case 'cenario':
        return this.abaCenario();
      case 'retroativo':
        return this.abaRetroativo();
      case 'operacoes':
        return this.abaOperacoes();
      default:
        return '<p class="text-muted">Aba não implementada</p>';
    }
  }

  abaEstrategias() {
    // SIM-PAI-2: Tabela 7+1 estratégias por ativo
    if (this.ativos.length === 0) {
      return `
        <div class="alert alert-info">
          <p class="mb-0">Nenhum ativo monitorado no simulador.</p>
          <p class="mb-0">
            <small>Adicione ativos usando o formulário abaixo ou pela tela de monitoramento.</small>
          </p>
        </div>
        ${this.formularioAdicionarAtivo()}
      `;
    }

    const linhas = this.ativos.map((ativo) => `
      <tr>
        <td><strong>${escaparHtml(ativo.simbolo)}</strong></td>
        <td>${ativo.janelaPregoes} pregões</td>
        <td>R$ ${Number(ativo.capitalInicial).toLocaleString('pt-BR')}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-danger btn-remover" data-simbolo="${escaparHtml(ativo.simbolo)}">
            Remover
          </button>
        </td>
      </tr>
    `).join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Janela</th>
              <th>Capital Inicial</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
      <hr class="my-3">
      ${this.formularioAdicionarAtivo()}
    `;
  }

  abaCenario() {
    // SIM-PAI-3: Cenário pontual (what-if)
    return `
      <div class="alert alert-info">
        <p class="mb-0">Cenário pontual: simule P&L para uma data e janela específicas.</p>
        <p class="mb-0"><small>Selecione um ativo, data de entrada, janela e capital para ver o resultado por estratégia.</small></p>
      </div>
      <form id="form-cenario" class="row g-3">
        <div class="col-md-3">
          <label for="cenario-ativo" class="form-label">Ativo</label>
          <select class="form-select form-select-sm" id="cenario-ativo" required>
            <option value="">Selecione...</option>
            ${this.ativos.map((a) => `<option value="${escaparHtml(a.simbolo)}">${escaparHtml(a.simbolo)}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label for="cenario-data" class="form-label">Data de entrada</label>
          <input type="date" class="form-control form-control-sm" id="cenario-data" required>
        </div>
        <div class="col-md-2">
          <label for="cenario-janela" class="form-label">Janela (pregões)</label>
          <select class="form-select form-select-sm" id="cenario-janela">
            <option value="21">21</option>
            <option value="63">63</option>
            <option value="126">126</option>
          </select>
        </div>
        <div class="col-md-2">
          <label for="cenario-capital" class="form-label">Capital (R$)</label>
          <input type="number" class="form-control form-control-sm" id="cenario-capital" value="10000" min="1000" step="1000" required>
        </div>
        <div class="col-md-2">
          <label class="form-label">&nbsp;</label>
          <button type="submit" class="btn btn-primary btn-sm w-100">Simular</button>
        </div>
      </form>
      <div id="resultado-cenario" class="mt-3"></div>
    `;
  }

  abaRetroativo() {
    // SIM-PAI-4: Retroativo histórico
    return `
      <div class="alert alert-info">
        <p class="mb-0">Retroativo: valide estratégias históricas contra retornos reais.</p>
        <p class="mb-0"><small>Selecione estratégia, janela e período para ver taxa de acerto e retorno médio.</small></p>
        <p class="mb-0"><small class="text-warning">Aviso: limitação in-sample - resultados históricos podem não se repetir no futuro.</small></p>
      </div>
      <form id="form-retroativo" class="row g-3">
        <div class="col-md-3">
          <label for="retroativo-ativo" class="form-label">Ativo</label>
          <select class="form-select form-select-sm" id="retroativo-ativo" required>
            <option value="">Selecione...</option>
            ${this.ativos.map((a) => `<option value="${escaparHtml(a.simbolo)}">${escaparHtml(a.simbolo)}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label for="retroativo-estrategia" class="form-label">Estratégia</label>
          <select class="form-select form-select-sm" id="retroativo-estrategia" required>
            <option value="MOMENTO_PURO">MOMENTO_PURO</option>
            <option value="BAIXO_SPREAD">BAIXO_SPREAD</option>
          </select>
        </div>
        <div class="col-md-2">
          <label for="retroativo-janela" class="form-label">Janela (pregões)</label>
          <select class="form-select form-select-sm" id="retroativo-janela">
            <option value="21">21</option>
            <option value="63">63</option>
            <option value="126">126</option>
          </select>
        </div>
        <div class="col-md-2">
          <label for="retroativo-inicio" class="form-label">Início</label>
          <input type="date" class="form-control form-control-sm" id="retroativo-inicio" required>
        </div>
        <div class="col-md-2">
          <label class="form-label">&nbsp;</label>
          <button type="submit" class="btn btn-primary btn-sm w-100">Analisar</button>
        </div>
      </form>
      <div id="resultado-retroativo" class="mt-3"></div>
    `;
  }

  abaOperacoes() {
    // SIM-PAI-5: Lista de operações manuais
    return `
      <div class="alert alert-info">
        <p class="mb-0">Operações manuais: acompanhe suas operações simuladas.</p>
        <p class="mb-0"><small>PENDENTE: aguardando data de entrada. ABERTA: em andamento. FECHADA: encerrada.</small></p>
      </div>
      <button type="button" class="btn btn-primary btn-sm mb-3" id="btn-nova-operacao">Nova Operação</button>
      <div id="lista-operacoes">
        <p class="text-muted">Carregando operações...</p>
      </div>
    `;
  }

  formularioAdicionarAtivo() {
    return `
      <form id="form-adicionar" class="row g-2 align-items-end">
        <div class="col-md-4">
          <label for="novo-ativo" class="form-label small">Adicionar ativo</label>
          <input type="text" class="form-control form-control-sm" id="novo-ativo" placeholder="PETR4" required pattern="[A-Z]{4}[0-9]{1,2}" title="Formato: XXXX00">
        </div>
        <div class="col-md-2">
          <label for="nova-janela" class="form-label small">Janela</label>
          <input type="number" class="form-control form-control-sm" id="nova-janela" value="63" min="1" max="252" required>
        </div>
        <div class="col-md-3">
          <label for="novo-capital" class="form-label small">Capital (R$)</label>
          <input type="number" class="form-control form-control-sm" id="novo-capital" value="100000" min="1000" step="1000" required>
        </div>
        <div class="col-md-3">
          <button type="submit" class="btn btn-success btn-sm w-100">Adicionar</button>
        </div>
      </form>
    `;
  }

  afterRender() {
    // Eventos das abas
    this.querySelectorAll('[data-aba]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.abaAtiva = e.target.dataset.aba;
        this.render();
      });
    });

    // Botão atualizar
    this.querySelector('#btn-atualizar')?.addEventListener('click', () => {
      this.carregarAtivos();
    });

    // Formulário adicionar ativo
    this.querySelector('#form-adicionar')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const simbolo = this.querySelector('#novo-ativo').value.toUpperCase();
      const janela = parseInt(this.querySelector('#nova-janela').value, 10);
      const capital = this.querySelector('#novo-capital').value;

      try {
        await registrarAtivoSimulador(simbolo);
        await this.carregarAtivos();
        this.querySelector('#form-adicionar').reset();
      } catch (err) {
        alert(`Erro ao adicionar ativo: ${err.message}`);
      }
    });

    // Botões remover
    this.querySelectorAll('.btn-remover').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const simbolo = btn.dataset.simbolo;
        if (confirm(`Remover ${simbolo} do simulador?`)) {
          try {
            await desativarAtivoSimulador(simbolo);
            await this.carregarAtivos();
          } catch (err) {
            alert(`Erro ao remover ativo: ${err.message}`);
          }
        }
      });
    });
  }
}

customElements.define('simulador-page', SimuladorPage);
