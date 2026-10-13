import { BaseComponent } from '../components/base/BaseComponent.js';
import {
  analisarIaSimulador,
  buscarHistoricoOperacao,
  buscarHistoricoPeriodo,
  buscarResultadosSimulador,
  cenarioSimulador,
  criarOperacaoSimulador,
  deletarOperacaoSimulador,
  desativarAtivoSimulador,
  listarAtivosSimulador,
  listarOperacoesSimulador,
  listarTodosAtivosBase,
  registrarAtivoSimulador,
  retroativoSimulador,
} from '../api/simuladorApi.js';
import { buscarResumo, buscarBloqueios } from '../api/operacionalApi.js';
import { buscarIndiceMacro } from '../api/indicesMacroApi.js';
import { buscarDiarioDeSinais } from '../api/validacaoApi.js';
import { listarAtivosPainel, listarSetoresBase } from '../api/baseAtivosApi.js';
import { htmlTabelaAtivos } from '../analise/listagemAtivos.js';
import { escaparHtml } from '../utils/html.js';
import { htmlTabelaEstrategias, obterIaLivre, resumoEstrategias, htmlConsultaRapida } from '../components/simulador/TabelaEstrategias.js';
import { htmlControlesCenario, htmlResultadoCenario, validarCenario } from '../components/simulador/CenarioSimulador.js';
import { htmlControlesRetroativo, htmlResultadoRetroativo, janelaEntreDatas } from '../components/simulador/Retroativo.js';
import { htmlHistoricoOperacao, htmlOperacoesManuais } from '../components/simulador/OperacoesManuais.js';
import { htmlOperabilidadeParalela } from '../components/simulador/OperabilidadeParalela.js';
import { campo, listaDe, validarSimboloAtivo, htmlComboboxAtivo, ESTRATEGIAS_PADRAO, CAPITAIS_SIMULACAO, CAPITAL_BASE, labelCapital } from '../components/simulador/utils.js';
import '../components/LoadingSpinner.js';
import '../components/StatusAlert.js';

// SIM-PAI-1: Página principal do simulador com 4 abas internas

// Escala pnlRs de cada ponto proporcionalmente; percentuais ficam inalterados.
function escalarHistorico(historico, capital) {
  if (!historico || capital === CAPITAL_BASE) return historico;
  const f = capital / CAPITAL_BASE;
  return {
    ...historico,
    totalPnlRs: (historico.totalPnlRs || 0) * f,
    pontos: (historico.pontos || []).map((p) => ({ ...p, pnlRs: (p.pnlRs || 0) * f })),
  };
}

const ABAS = [
  { id: 'estrategias', rotulo: 'Estratégias' },
  { id: 'cenario', rotulo: 'Cenário' },
  { id: 'retroativo', rotulo: 'Retroativo' },
  { id: 'operacoes', rotulo: 'Operações' },
];

function abaSalva() {
  try {
    const aba = globalThis.sessionStorage?.getItem('simulador-aba');
    return ABAS.some((item) => item.id === aba) ? aba : 'estrategias';
  } catch {
    return 'estrategias';
  }
}

export class SimuladorPage extends BaseComponent {
  constructor() {
    super();
    this.abaAtiva = abaSalva();
    this.cenarioPreenchido = null;
    this.ativos = [];
    this.todosAtivos = [];
    this.resultadosPorAtivo = {};
    this.iaPorAtivo = {};
    this.carregandoIa = '';
    this.resultadoCenario = null;
    this.erroCenario = '';
    this.resultadoRetroativo = null;
    this.historicoRetroativo = null;
    this.retroativoParams = null;
    this.erroRetroativo = '';
    this.operacoes = null;
    this.erroOperacoes = '';
    this.filtroStatusOperacoes = '';
    this.resumoOperabilidade = null;
    this.carregando = false;
    this.erro = null;
    // 11: historicos auto-carregados por operação
    this.historicosPorOperacoes = {};
    // 3: data de referência para estratégias
    this.dataEstrategias = '';
    // capital selecionado para escalar P&L no retroativo (pregão a pregão)
    this.capitalRetroativo = CAPITAL_BASE;
    // 3: taxa SELIC anual para contexto
    this.selicAtual = null;
    // 8: bloqueios do dia na aba Operações
    this.bloqueiosHoje = null;
    // universo completo em Estratégias
    this.setores = [];
    this.universoFiltros = null;
    this.universoResultado = null;
    // 9: restaura último resultado retroativo
    try {
      const saved = JSON.parse(sessionStorage.getItem('simulador-retroativo') || 'null');
      if (saved) {
        this.resultadoRetroativo = saved.resultadoRetroativo ?? null;
        this.historicoRetroativo = saved.historicoRetroativo ?? null;
        this.retroativoParams = saved.retroativoParams ?? null;
      }
    } catch { /* ignore */ }
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
      const [dados, todos, selic] = await Promise.all([
        listarAtivosSimulador(),
        listarTodosAtivosBase().catch(() => []),
        buscarIndiceMacro('SELIC').catch(() => null),
      ]);
      const selicPontos = Array.isArray(selic) ? selic : [];
      this.selicAtual = selicPontos[0]?.valor != null ? Number(selicPontos[0].valor) : null;
      this.ativos = listaDe(dados);
      this.todosAtivos = todos;
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
        return [simbolo, await buscarResultadosSimulador(simbolo, this.dataEstrategias || null)];
      } catch {
        return [simbolo, { resultados: [] }];
      }
    }));
    this.resultadosPorAtivo = Object.fromEntries(pares.filter(Boolean));
  }

  // 8: carrega bloqueios do dia para exibir na aba Operações
  async carregarBloqueiosHoje() {
    if (this.bloqueiosHoje !== null) return;
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const resp = await buscarBloqueios({ data: hoje });
      this.bloqueiosHoje = resp?.indisponivel ? [] : (resp?.itens || []);
    } catch {
      this.bloqueiosHoje = [];
    }
  }

  async carregarUniverso() {
    const container = this.querySelector('#universo-resultado');
    if (container) container.innerHTML = '<span class="spinner-border spinner-border-sm ms-1"></span>';

    if (!this.setores.length) {
      try {
        const resp = await listarSetoresBase();
        const lista = Array.isArray(resp) ? resp : (resp?.itens || resp?.setores || []);
        this.setores = lista.map((x) => (typeof x === 'string' ? x : x.nome || x.setor || String(x))).filter(Boolean);
        const sel = this.querySelector('#universo-setor');
        if (sel && this.setores.length) {
          const atual = this.universoFiltros?.setor || '';
          sel.innerHTML = `<option value="">Todos os setores</option>${this.setores.map((s) =>
            `<option value="${escaparHtml(s)}"${s === atual ? ' selected' : ''}>${escaparHtml(s)}</option>`
          ).join('')}`;
        }
      } catch { /* ignora — select fica com "Todos os setores" */ }
    }

    try {
      const resultado = await listarAtivosPainel({
        q: this.universoFiltros?.q || '',
        setor: this.universoFiltros?.setor || '',
        uf: this.universoFiltros?.uf || '',
        pagina: 0,
        tamanho: 30,
      });
      this.universoResultado = resultado;
      if (container) container.innerHTML = htmlTabelaAtivos(resultado?.content || []);
    } catch (err) {
      if (container) container.innerHTML = `<p class="small text-danger mt-1">${escaparHtml(err?.message || 'Erro ao buscar ativos')}</p>`;
    }
  }

  // 11: carrega historicos para operações com dataEntrada <= hoje
  async autoCarregarHistoricos() {
    const ops = Array.isArray(this.operacoes) ? this.operacoes : (this.operacoes?.itens || []);
    const hoje = new Date().toISOString().slice(0, 10);
    const pendentes = ops.filter((o) =>
      o.dataEntrada && String(o.dataEntrada) <= hoje &&
      !Object.prototype.hasOwnProperty.call(this.historicosPorOperacoes, o.id)
    );
    if (!pendentes.length) return;
    await Promise.all(pendentes.map(async (o) => {
      try { this.historicosPorOperacoes[o.id] = await buscarHistoricoOperacao(o.id); }
      catch { this.historicosPorOperacoes[o.id] = null; }
    }));
    if (this.abaAtiva === 'operacoes') this.render();
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

    // 3: date picker + taxa SELIC para contexto
    const selicChip = this.selicAtual != null
      ? `<span class="badge text-bg-secondary ms-2" title="Selic meta anual — referência de custo de oportunidade">Selic ${this.selicAtual.toFixed(2)}% a.a.</span>`
      : '';
    const datePicker = `<div class="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <span class="small text-muted">Sinais de:</span>
      <input type="date" id="data-estrategias" class="form-control form-control-sm w-auto"
             value="${escaparHtml(this.dataEstrategias)}" title="Data do pregão (vazio = mais recente)">
      ${this.dataEstrategias ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="btn-hoje-estrategias">Hoje</button>` : ''}
      ${selicChip}
    </div>`;

    return `${datePicker}
      ${resumoEstrategias(this.ativos, this.resultadosPorAtivo)}
      ${htmlTabelaEstrategias(this.ativos, this.resultadosPorAtivo, this.iaPorAtivo, this.carregandoIa)}
      ${remover}
      <hr class="my-3">
      ${this.formularioAdicionarAtivo()}
      ${htmlConsultaRapida()}
      <hr class="my-3">
      ${this._htmlUniversoCompleto()}
    `;
  }

  abaCenario() {
    return `
      <div class="alert alert-info">
        <p class="mb-0">Cenário pontual: simule P&L para uma data e janela específicas.</p>
        <p class="mb-0"><small>Selecione um ativo, data de entrada, janela e capital para ver o resultado por estratégia.</small></p>
      </div>
      ${htmlControlesCenario(this.todosAtivos, this.cenarioPreenchido || {})}
      <div id="resultado-cenario" class="mt-3">${this.erroCenario ? `<div class="alert alert-danger small">${escaparHtml(this.erroCenario)}</div>` : htmlResultadoCenario(this.resultadoCenario)}</div>
    `;
  }

  abaRetroativo() {
    const { simbolo, inicio, fim } = this.retroativoParams || {};
    // 3: contexto de taxa para comparação
    const selicRetroChip = this.selicAtual != null
      ? `<span class="badge text-bg-secondary ms-2" title="Selic meta — use como benchmark">Selic ${this.selicAtual.toFixed(2)}% a.a.</span>`
      : '';
    const janelaChip = inicio && fim
      ? `<p class="small text-muted mt-1 mb-0">Janela estimada: <strong>${janelaEntreDatas(inicio, fim)}</strong> pregões${selicRetroChip}</p>`
      : '';

    const tituloHistorico = simbolo
      ? `Pregão a pregão — ${escaparHtml(simbolo)} (${escaparHtml(inicio || '')} → ${escaparHtml(fim || '')})`
      : 'Pregão a pregão';

    const btnCsv = this.historicoRetroativo?.pontos?.length
      ? `<button type="button" class="btn btn-sm btn-outline-secondary ms-2" id="btn-csv-retroativo">⬇ CSV</button>`
      : '';

    // seletor de capital para escalar P&L client-side
    const seletorCapital = this.historicoRetroativo
      ? `<div class="d-flex align-items-center gap-1 flex-wrap">
           <span class="small text-muted me-1">Capital:</span>
           ${CAPITAIS_SIMULACAO.map((c) => `<button type="button"
             class="btn btn-sm ${c === this.capitalRetroativo ? 'btn-primary' : 'btn-outline-secondary'}"
             data-capital-retroativo="${c}">${escaparHtml(labelCapital(c))}</button>`).join('')}
         </div>`
      : '';

    const secaoHistorico = this.historicoRetroativo
      ? `<div class="mt-4">
           <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
             <h6 class="text-muted mb-0">${tituloHistorico}</h6>${btnCsv}
           </div>
           ${seletorCapital}
           <div class="mt-2">${htmlHistoricoOperacao(escalarHistorico(this.historicoRetroativo, this.capitalRetroativo))}</div>
         </div>`
      : '';

    return `
      <div class="alert alert-info">
        <p class="mb-0">Retroativo: valide estratégias históricas contra retornos reais.</p>
        <p class="mb-0"><small>Selecione estratégia, janela e período para ver taxa de acerto e retorno médio.</small></p>
      </div>
      ${htmlControlesRetroativo(this.todosAtivos)}
      ${janelaChip}
      <div id="resultado-retroativo" class="mt-3">${this.erroRetroativo ? `<div class="alert alert-danger small">${escaparHtml(this.erroRetroativo)}</div>` : htmlResultadoRetroativo(this.resultadoRetroativo)}</div>
      ${secaoHistorico}
    `;
  }

  abaOperacoes() {
    // 8: painel de bloqueios do dia (sinais que não viraram operação)
    const itensBloc = this.bloqueiosHoje || [];
    const bloqueiosHtml = itensBloc.length
      ? `<details class="mb-3">
           <summary class="small text-muted" style="cursor:pointer;list-style:none">
             ⚠ ${itensBloc.length} sinal(is) bloqueado(s) hoje — clique para ver
           </summary>
           <ul class="list-unstyled small mt-1 mb-0 ps-2">
             ${itensBloc.map((b) => `<li class="text-muted">
               <strong>${escaparHtml(b.simbolo || '—')}</strong>
               ${escaparHtml(b.motivo || b.tipoMotivo || b.descricao || 'motivo não informado')}
               ${b.estrategia ? ` · ${escaparHtml(b.estrategia)}` : ''}
             </li>`).join('')}
           </ul>
         </details>`
      : '';

    return `
      <div class="alert alert-info">
        <p class="mb-0">Operações manuais: acompanhe suas operações simuladas.</p>
        <p class="mb-0"><small>PENDENTE: aguardando data de entrada. ABERTA: em andamento. FECHADA: encerrada.</small></p>
      </div>
      ${bloqueiosHtml}
      ${this.erroOperacoes ? `<div class="alert alert-warning small">${escaparHtml(this.erroOperacoes)}</div>` : ''}
      <div id="lista-operacoes">${htmlOperacoesManuais(this.operacoes, this.todosAtivos, this.filtroStatusOperacoes, this.historicosPorOperacoes)}</div>
    `;
  }

  _htmlUniversoCompleto() {
    const setoresOpcoes = this.setores.map((s) =>
      `<option value="${escaparHtml(s)}"${s === (this.universoFiltros?.setor || '') ? ' selected' : ''}>${escaparHtml(s)}</option>`
    ).join('');

    const conteudo = this.universoResultado
      ? htmlTabelaAtivos(this.universoResultado?.content || [])
      : '<p class="small text-muted mb-0">Use os filtros acima para buscar no universo completo.</p>';

    return `<div>
      <p class="small fw-semibold mb-2">Universo completo (${this.todosAtivos.length} ativos)</p>
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-4">
          <input type="text" id="universo-busca" class="form-control form-control-sm"
                 placeholder="Símbolo ou nome…" value="${escaparHtml(this.universoFiltros?.q || '')}">
        </div>
        <div class="col-md-3">
          <select id="universo-setor" class="form-select form-select-sm">
            <option value="">Todos os setores</option>
            ${setoresOpcoes}
          </select>
        </div>
        <div class="col-md-2">
          <input type="text" id="universo-uf" class="form-control form-control-sm"
                 placeholder="UF" maxlength="2" value="${escaparHtml(this.universoFiltros?.uf || '')}"
                 style="text-transform:uppercase">
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-primary btn-sm w-100" id="btn-universo-filtrar">Filtrar</button>
        </div>
      </div>
      <div id="universo-resultado">${conteudo}</div>
    </div>`;
  }

  formularioAdicionarAtivo() {
    return `
      <form id="form-adicionar" class="row g-2 align-items-end">
        <div class="col-md-4">
          <label for="novo-ativo" class="form-label small">Adicionar ativo</label>
          ${htmlComboboxAtivo('novo-ativo', this.todosAtivos, { placeholder: 'PETR4' })}
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
      btn.addEventListener('click', (evento) => {
        this.trocarAba(evento.currentTarget.dataset.aba);
      });
    });

    this.querySelectorAll('[data-simular-cenario]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.cenarioPreenchido = {
          simbolo: btn.dataset.simbolo,
          dataEntrada: btn.dataset.dataEntrada,
        };
        this.resultadoCenario = null;
        this.erroCenario = '';
        this.trocarAba('cenario');
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
      };
      const erro = validarCenario(dados);
      if (erro) {
        this.erroCenario = erro;
        this.resultadoCenario = null;
        this.render();
        return;
      }
      try {
        this.resultadoCenario = await cenarioSimulador(dados.simbolo, dados.dataEntrada, dados.janela, CAPITAL_BASE);
        this.erroCenario = '';
      } catch (erroApi) {
        this.erroCenario = erroApi?.message || 'Erro ao simular cenário.';
      }
      this.render();
    });

    this.querySelector('#form-retroativo')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const simbolo = this.querySelector('#retroativo-ativo')?.value;
      const inicio = this.querySelector('#retroativo-inicio')?.value;
      const fim = this.querySelector('#retroativo-fim')?.value;
      if (!simbolo || !inicio || !fim || fim < inicio) {
        this.erroRetroativo = 'Selecione ativo, início e fim (fim deve ser posterior ao início).';
        this.render();
        return;
      }
      const janela = janelaEntreDatas(inicio, fim);
      this.erroRetroativo = '';
      this.resultadoRetroativo = null;
      this.historicoRetroativo = null;
      this.retroativoParams = { simbolo, inicio, fim };
      this.render();
      try {
        const [resultados, historico] = await Promise.all([
          Promise.all(
            ESTRATEGIAS_PADRAO.map(async (estrategia) => {
              try {
                const resultado = await retroativoSimulador(simbolo, estrategia, 'v1', janela, inicio);
                return { estrategia, resultado, erro: null };
              } catch (err) {
                return { estrategia, resultado: null, erro: err?.message || 'indisponível' };
              }
            })
          ),
          buscarHistoricoPeriodo(simbolo, inicio, fim).catch(() => null),
        ]);
        this.resultadoRetroativo = resultados;
        this.historicoRetroativo = historico;
        // 9: persiste resultado para restaurar ao trocar de aba
        try {
          sessionStorage.setItem('simulador-retroativo', JSON.stringify({
            resultadoRetroativo: resultados,
            historicoRetroativo: historico,
            retroativoParams: this.retroativoParams,
          }));
        } catch { /* ignore */ }
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

    // 11: auto-carrega historicos quando a aba Operações é mostrada
    if (this.abaAtiva === 'operacoes') {
      this.autoCarregarHistoricos();
      // 8: carrega bloqueios do dia uma vez por sessão
      this.carregarBloqueiosHoje().then(() => {
        if (this.abaAtiva === 'operacoes' && (this.bloqueiosHoje?.length ?? 0) > 0) this.render();
      });
    }

    // 10: diário de sinais inline — carrega ao abrir o <details>
    this.querySelectorAll('[data-carregar-diario]').forEach((summary) => {
      const details = summary.closest('details');
      if (!details) return;
      details.addEventListener('toggle', async () => {
        if (!details.open) return;
        const simbolo = summary.dataset.carregarDiario;
        const container = this.querySelector(`#diario-sinais-${CSS.escape(simbolo)}`);
        if (!container || container.dataset.carregado) return;
        container.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
          const dados = await buscarDiarioDeSinais({ simbolo, limite: 15 });
          const sinais = Array.isArray(dados) ? dados : (dados?.itens || []);
          if (!sinais.length) {
            container.innerHTML = '<p class="text-muted mb-0">Sem sinais registrados para este ativo.</p>';
          } else {
            container.innerHTML = `<div class="d-flex flex-wrap gap-1 mt-1">${sinais.slice(0, 15).map((s) => {
              const cor = s.sinal === 'COMPRA' ? 'success' : s.sinal === 'VENDA' ? 'danger' : 'secondary';
              return `<span class="badge text-bg-${cor}" title="${escaparHtml(s.estrategia || '')}">${escaparHtml(String(s.dataPregao || s.data || '').slice(0, 10))} ${escaparHtml(s.sinal || s.tipo || '—')}</span>`;
            }).join('')}</div>`;
          }
          container.dataset.carregado = '1';
        } catch {
          container.innerHTML = '<p class="text-muted small mb-0">Diário indisponível.</p>';
        }
      }, { once: true });
    });

    // 3: date picker de sinais históricos (Estratégias)
    this.querySelector('#data-estrategias')?.addEventListener('change', async (e) => {
      this.dataEstrategias = e.target.value;
      await this.carregarResultadosEstrategias();
      this.render();
    });
    this.querySelector('#btn-hoje-estrategias')?.addEventListener('click', async () => {
      this.dataEstrategias = '';
      await this.carregarResultadosEstrategias();
      this.render();
    });

    // seletor de capital no retroativo (escala P&L client-side)
    this.querySelectorAll('[data-capital-retroativo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.capitalRetroativo = Number(btn.dataset.capitalRetroativo);
        this.render();
      });
    });

    // combobox consulta rápida: filtra por símbolo OU nome conforme digita
    const inputConsulta = this.querySelector('#consulta-ativo');
    const listaConsulta = this.querySelector('#consulta-ativo-sugestoes');
    if (inputConsulta && listaConsulta) {
      const atualizarSugestoes = () => {
        const q = inputConsulta.value.trim().toUpperCase();
        if (q.length < 1) { listaConsulta.classList.remove('show'); return; }
        const matches = this.todosAtivos
          .filter((a) => {
            const s = (a.simbolo || '').toUpperCase();
            const n = (a.nome || '').toUpperCase();
            return s.startsWith(q) || n.includes(q);
          })
          .slice(0, 10);
        if (!matches.length) { listaConsulta.classList.remove('show'); return; }
        listaConsulta.innerHTML = matches.map((a) =>
          `<li><button type="button" class="dropdown-item small py-1" data-simbolo="${escaparHtml(a.simbolo || a)}">
            <strong>${escaparHtml(a.simbolo || a)}</strong>
            ${a.nome ? `<span class="text-muted ms-2">${escaparHtml(a.nome)}</span>` : ''}
          </button></li>`
        ).join('');
        listaConsulta.classList.add('show');
        listaConsulta.querySelectorAll('[data-simbolo]').forEach((btn) => {
          btn.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            inputConsulta.value = btn.dataset.simbolo;
            listaConsulta.classList.remove('show');
            inputConsulta.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          });
        });
      };
      inputConsulta.addEventListener('input', atualizarSugestoes);
      inputConsulta.addEventListener('focus', atualizarSugestoes);
      inputConsulta.addEventListener('blur', () => {
        setTimeout(() => listaConsulta.classList.remove('show'), 150);
      });
    }

    // universo completo — botão filtrar
    this.querySelector('#btn-universo-filtrar')?.addEventListener('click', () => {
      this.universoFiltros = {
        q: this.querySelector('#universo-busca')?.value?.trim() || '',
        setor: this.querySelector('#universo-setor')?.value || '',
        uf: (this.querySelector('#universo-uf')?.value || '').toUpperCase(),
      };
      this.carregarUniverso();
    });

    // 1: consulta rápida de qualquer ativo
    this.querySelector('#form-consulta-rapida')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const simbolo = (this.querySelector('#consulta-ativo')?.value || '').toUpperCase();
      const data = this.querySelector('#consulta-data')?.value || null;
      const container = this.querySelector('#resultado-consulta-rapida');
      if (!simbolo || !container) return;
      container.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
      try {
        const resultado = await buscarResultadosSimulador(simbolo, data);
        const lista = Array.isArray(resultado) ? resultado : (resultado?.resultados || []);
        if (!lista.length) {
          container.innerHTML = '<p class="small text-muted mt-1">Nenhum sinal encontrado para este ativo.</p>';
          return;
        }
        container.innerHTML = htmlTabelaEstrategias([{ simbolo }], { [simbolo]: lista }, {}, '');
      } catch (err) {
        container.innerHTML = `<p class="small text-danger mt-1">${escaparHtml(err.message || 'Erro ao consultar')}</p>`;
      }
    });

    // 9: salva retroativo em sessionStorage após análise
    // (feito dentro do handler do form-retroativo abaixo)

    // 10: CSV da tabela "Pregão a pregão"
    this.querySelector('#btn-csv-retroativo')?.addEventListener('click', () => {
      const { pontos = [] } = this.historicoRetroativo || {};
      if (!pontos.length) return;
      const { simbolo = 'ativo', inicio = 'periodo' } = this.retroativoParams || {};
      const estrategias = [...new Set(pontos.flatMap((p) => Object.keys(p.quintilPorEstrategia || {})))].sort();
      const cabecalho = ['Data', 'Preco', 'RetornoDia_pct', 'RetornoAcum_pct', 'PnL_R$', ...estrategias].join(';');
      const linhas = pontos.map((p) => [
        p.dataPregao,
        p.preco,
        (Number(p.retornoDiaPct) * 100).toFixed(4),
        (Number(p.retornoAcumPct) * 100).toFixed(4),
        p.pnlRs,
        ...estrategias.map((e) => p.quintilPorEstrategia?.[e] ?? ''),
      ].join(';'));
      const csv = [cabecalho, ...linhas].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retroativo_${simbolo}_${inicio}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // P&L completo — carrega on-demand e alterna visibilidade
    this.querySelectorAll('[data-historico-operacao]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.historicoOperacao;
        const container = this.querySelector(`#historico-${id}`);
        if (!container) return;

        if (container.style.display !== 'none') {
          container.style.display = 'none';
          btn.textContent = 'Ver desempenho';
          return;
        }

        if (!container.dataset.carregado) {
          container.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Carregando…';
          container.style.display = 'block';
          try {
            const historico = await buscarHistoricoOperacao(id);
            // 7: passa versaoEstrategia para destacar a coluna certa na tabela
            const ops = Array.isArray(this.operacoes) ? this.operacoes : (this.operacoes?.itens || []);
            const op = ops.find((o) => String(o.id) === String(id));
            container.innerHTML = htmlHistoricoOperacao(historico, op?.versaoEstrategia || null);
            container.dataset.carregado = '1';
          } catch (err) {
            container.innerHTML = `<p class="small text-danger">Erro ao carregar histórico: ${escaparHtml(err.message || 'indisponível')}</p>`;
          }
        } else {
          container.style.display = 'block';
        }

        btn.textContent = 'Ocultar P&L';
      });
    });

    // Retroativo — P&L por período (carregado on-demand por entrada)
    this.querySelectorAll('[data-historico-periodo]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const simbolo = btn.dataset.simbolo;
        const inicio = btn.dataset.inicio;
        const fim = btn.dataset.fim;
        const containerId = `hist-retro-${simbolo}-${inicio}`;
        const row = this.querySelector(`#${containerId}`);
        if (!row) return;

        const td = row.querySelector('td');
        if (row.style.display !== 'none') {
          row.style.display = 'none';
          btn.textContent = 'P&L';
          return;
        }

        if (!row.dataset.carregado) {
          td.innerHTML = '<span class="spinner-border spinner-border-sm ms-1"></span>';
          row.style.display = '';
          try {
            const historico = await buscarHistoricoPeriodo(simbolo, inicio, fim);
            td.innerHTML = htmlHistoricoOperacao(historico);
            row.dataset.carregado = '1';
          } catch (err) {
            td.innerHTML = `<p class="small text-danger ms-1">Erro: ${escaparHtml(err.message || 'indisponível')}</p>`;
          }
        } else {
          row.style.display = '';
        }
        btn.textContent = 'Ocultar';
      });
    });
  }

  trocarAba(aba) {
    if (!ABAS.some((item) => item.id === aba)) return;
    this.abaAtiva = aba;
    try {
      globalThis.sessionStorage?.setItem('simulador-aba', aba);
    } catch {
      // O simulador continua funcionando sem armazenamento de sessão.
    }
    this.render();
  }
}

customElements.define('simulador-page', SimuladorPage);
