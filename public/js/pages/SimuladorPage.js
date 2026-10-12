import { BaseComponent } from '../components/base/BaseComponent.js';
import {
  analisarIaSimulador,
  buscarResultadosSimulador,
  cenarioSimulador,
  criarOperacaoSimulador,
  deletarOperacaoSimulador,
  desativarAtivoSimulador,
  listarAtivosSimulador,
  listarOperacoesSimulador,
  registrarAtivoSimulador,
  retroativoSimulador,
} from '../api/simuladorApi.js';
import { buscarResumo } from '../api/operacionalApi.js';
import { escaparHtml } from '../utils/html.js';
import { htmlTabelaEstrategias, obterIaLivre } from '../components/simulador/TabelaEstrategias.js';
import { htmlControlesCenario, htmlResultadoCenario, validarCenario } from '../components/simulador/CenarioSimulador.js';
import { htmlControlesRetroativo, htmlResultadoRetroativo } from '../components/simulador/Retroativo.js';
import { htmlOperacoesManuais } from '../components/simulador/OperacoesManuais.js';
import { htmlOperabilidadeParalela } from '../components/simulador/OperabilidadeParalela.js';
import { campo, listaDe, validarSimboloAtivo } from '../components/simulador/utils.js';
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
    this.resultadosPorAtivo = {};
    this.iaPorAtivo = {};
    this.carregandoIa = '';
    this.resultadoCenario = null;
    this.erroCenario = '';
    this.resultadoRetroativo = null;
    this.erroRetroativo = '';
    this.operacoes = null;
    this.erroOperacoes = '';
    this.filtroStatusOperacoes = '';
    this.resumoOperabilidade = null;
    this.carregando = false;
    this.erro = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.carregarAtivos();
    this.render();
  }

  render() {
    this.innerHTML = this.template();
    this.afterRender();
  }

  async carregarAtivos() {
    this.carregando = true;
    this.erro = null;
    this.render();

    try {
      const dados = await listarAtivosSimulador();
      this.ativos = listaDe(dados);
      await Promise.all([
        this.carregarResultadosEstrategias(),
        this.carregarOperacoes(),
        this.carregarOperabilidadeParalela(),
      ]);
    } catch (e) {
      console.error('Erro ao carregar ativos do simulador:', e);
      this.erro = e.message || 'Erro ao carregar ativos';
    } finally {
      this.carregando = false;
      this.render();
    }
  }

  async carregarResultadosEstrategias() {
    const pares = await Promise.all(this.ativos.map(async (ativo) => {
      const simbolo = campo(ativo, ['simbolo', 'ticker'], '');
      if (!simbolo) return null;
      try {
        return [simbolo, await buscarResultadosSimulador(simbolo)];
      } catch {
        return [simbolo, { resultados: [] }];
      }
    }));
    this.resultadosPorAtivo = Object.fromEntries(pares.filter(Boolean));
  }

  async carregarOperacoes() {
    try {
      this.operacoes = await listarOperacoesSimulador();
      this.erroOperacoes = '';
    } catch (erro) {
      this.operacoes = { itens: [] };
      this.erroOperacoes = erro?.message || 'Não foi possível carregar operações.';
    }
  }

  async carregarOperabilidadeParalela() {
    if (this.resumoOperabilidade) return;
    try {
      this.resumoOperabilidade = await buscarResumo();
    } catch {
      this.resumoOperabilidade = null;
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
      <div class="row g-3">
        <div class="col-lg-9">
          <div class="d-flex gap-2 mb-3" role="group" aria-label="Abas do simulador">${chips}</div>
          ${conteudoAba}
        </div>
        <div class="col-lg-3">${htmlOperabilidadeParalela(this.resumoOperabilidade)}</div>
      </div>
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
    const remover = this.ativos.length ? `<div class="table-responsive mt-3">
      <table class="table table-sm"><thead><tr><th>Ativo</th><th>Ações</th></tr></thead>
      <tbody>${this.ativos.map((ativo) => `<tr><td>${escaparHtml(campo(ativo, ['simbolo', 'ticker'], ''))}</td>
        <td><button type="button" class="btn btn-sm btn-outline-danger btn-remover" data-simbolo="${escaparHtml(campo(ativo, ['simbolo', 'ticker'], ''))}">Remover</button></td></tr>`).join('')}</tbody></table>
    </div>` : '';

    return `${htmlTabelaEstrategias(this.ativos, this.resultadosPorAtivo, this.iaPorAtivo, this.carregandoIa)}
      ${remover}
      <hr class="my-3">
      ${this.formularioAdicionarAtivo()}
    `;
  }

  abaCenario() {
    return `
      <div class="alert alert-info">
        <p class="mb-0">Cenário pontual: simule P&L para uma data e janela específicas.</p>
        <p class="mb-0"><small>Selecione um ativo, data de entrada, janela e capital para ver o resultado por estratégia.</small></p>
      </div>
      ${htmlControlesCenario(this.ativos)}
      <div id="resultado-cenario" class="mt-3">${this.erroCenario ? `<div class="alert alert-danger small">${escaparHtml(this.erroCenario)}</div>` : htmlResultadoCenario(this.resultadoCenario)}</div>
    `;
  }

  abaRetroativo() {
    return `
      <div class="alert alert-info">
        <p class="mb-0">Retroativo: valide estratégias históricas contra retornos reais.</p>
        <p class="mb-0"><small>Selecione estratégia, janela e período para ver taxa de acerto e retorno médio.</small></p>
      </div>
      ${htmlControlesRetroativo(this.ativos)}
      <div id="resultado-retroativo" class="mt-3">${this.erroRetroativo ? `<div class="alert alert-danger small">${escaparHtml(this.erroRetroativo)}</div>` : htmlResultadoRetroativo(this.resultadoRetroativo)}</div>
    `;
  }

  abaOperacoes() {
    return `
      <div class="alert alert-info">
        <p class="mb-0">Operações manuais: acompanhe suas operações simuladas.</p>
        <p class="mb-0"><small>PENDENTE: aguardando data de entrada. ABERTA: em andamento. FECHADA: encerrada.</small></p>
      </div>
      ${this.erroOperacoes ? `<div class="alert alert-warning small">${escaparHtml(this.erroOperacoes)}</div>` : ''}
      <div id="lista-operacoes">${htmlOperacoesManuais(this.operacoes, this.ativos, this.filtroStatusOperacoes)}</div>
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

    this.querySelectorAll('[data-ia-livre], [data-analisar-ia]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const simbolo = btn.dataset.iaLivre || btn.dataset.analisarIa;
        this.carregandoIa = simbolo;
        this.render();
        try {
          this.iaPorAtivo[simbolo] = await obterIaLivre(simbolo, this.resultadosPorAtivo[simbolo], analisarIaSimulador);
        } catch (erro) {
          this.iaPorAtivo[simbolo] = { texto: erro?.message || 'Não foi possível gerar IA_LIVRE agora.' };
        } finally {
          this.carregandoIa = '';
          this.render();
        }
      });
    });

    this.querySelector('#form-cenario')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dados = {
        simbolo: this.querySelector('#cenario-ativo')?.value,
        dataEntrada: this.querySelector('#cenario-data')?.value,
        janela: this.querySelector('#cenario-janela')?.value,
        capital: this.querySelector('#cenario-capital')?.value,
      };
      const erro = validarCenario(dados);
      if (erro) {
        this.erroCenario = erro;
        this.resultadoCenario = null;
        this.render();
        return;
      }
      try {
        this.resultadoCenario = await cenarioSimulador(dados.simbolo, dados.dataEntrada, dados.janela, dados.capital);
        this.erroCenario = '';
      } catch (erroApi) {
        this.erroCenario = erroApi?.message || 'Erro ao simular cenário.';
      }
      this.render();
    });

    this.querySelector('#form-retroativo')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        this.resultadoRetroativo = await retroativoSimulador(
          this.querySelector('#retroativo-ativo')?.value,
          this.querySelector('#retroativo-estrategia')?.value,
          'v1',
          this.querySelector('#retroativo-janela')?.value,
          this.querySelector('#retroativo-inicio')?.value,
        );
        this.erroRetroativo = '';
      } catch (erroApi) {
        this.erroRetroativo = erroApi?.message || 'Erro ao analisar retroativo.';
      }
      this.render();
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
      const erroAtivo = validarSimboloAtivo(simbolo);
      if (erroAtivo) {
        alert(erroAtivo);
        return;
      }

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

    // Filtro de status na aba Operações
    this.querySelectorAll('[data-filtro-status]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.filtroStatusOperacoes = e.currentTarget.dataset.filtroStatus;
        this.render();
      });
    });

    // Criar operação manual
    this.querySelector('#form-operacao')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const simbolo = this.querySelector('#operacao-ativo')?.value;
      const dataEntrada = this.querySelector('#operacao-data')?.value;
      const capital = this.querySelector('#operacao-capital')?.value;
      const versaoEstrategia = this.querySelector('#operacao-versao')?.value;
      if (!simbolo || !dataEntrada || !capital || !versaoEstrategia) return;
      try {
        await criarOperacaoSimulador(simbolo, dataEntrada, capital, versaoEstrategia);
        await this.carregarOperacoes();
        this.render();
        this.querySelector('details')?.removeAttribute('open');
      } catch (err) {
        alert(`Erro ao criar operação: ${err.message}`);
      }
    });

    // Excluir operação PENDENTE
    this.querySelectorAll('[data-excluir-operacao]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.excluirOperacao;
        if (confirm('Excluir esta operação?')) {
          try {
            await deletarOperacaoSimulador(id);
            await this.carregarOperacoes();
            this.render();
          } catch (err) {
            alert(`Erro ao excluir operação: ${err.message}`);
          }
        }
      });
    });

    // Encerrar operação ABERTA
    this.querySelectorAll('[data-encerrar-operacao]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.encerrarOperacao;
        if (confirm('Encerrar (arquivar) esta operação?')) {
          try {
            await deletarOperacaoSimulador(id);
            await this.carregarOperacoes();
            this.render();
          } catch (err) {
            alert(`Erro ao encerrar operação: ${err.message}`);
          }
        }
      });
    });
  }
}

customElements.define('simulador-page', SimuladorPage);
