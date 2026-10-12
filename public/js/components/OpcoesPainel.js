import { BaseComponent } from './base/BaseComponent.js';
import { escaparHtml } from '../utils/html.js';

// BDI 12 = call, 14 = put (B3 COTAHIST).
const BDI_TIPO = { '12': 'CALL', '14': 'PUT' };
const BDI_COR  = { '12': 'text-success', '14': 'text-danger' };

const STATUS_OPCOES = {
  SEM_CADEIA_VALIDA: {
    titulo: 'Sem cadeia válida',
    proximo: 'Aguarde uma carga validada por ativo-objeto antes de interpretar strikes, vencimentos ou assertividade.',
    classe: 'warning',
  },
  CARGA_OPCOES_AUSENTE: {
    titulo: 'Carga de opções ausente',
    proximo: 'A rotina de opções ainda precisa publicar dados válidos; nenhuma leitura operacional deve ser feita agora.',
    classe: 'secondary',
  },
  BASE_OPCOES_CONTAMINADA: {
    titulo: 'Base bloqueada por qualidade',
    proximo: 'A consulta por prefixo foi bloqueada para evitar misturar séries de ativos diferentes ou vencimentos inválidos.',
    classe: 'danger',
  },
  TICKER_NORMALIZADO: {
    titulo: 'Ticker normalizado',
    proximo: 'Confira o código canônico usado antes de comparar a cadeia com preço, liquidez e payoff.',
    classe: 'info',
  },
};

// Unica responsabilidade: renderizar a tabela de opcoes de um ativo no ultimo
// pregao disponivel. OPT-PAI-3: filtros interativos por vencimento, tipo,
// moneyness e minimo de negocios. OPT-PAI-4: avisos pedagogicos de risco.
export class OpcoesPainel extends BaseComponent {
  constructor() {
    super();
    this._filtros = { vencimento: '', tipo: '', moneyness: '', minNegocios: 0 };
    this._dados = null;
  }

  setDados(dados) {
    this._dados = dados;
    this._filtros = { vencimento: '', tipo: '', moneyness: '', minNegocios: 0 };
    this.innerHTML = dados ? this._template(dados) : '';
    this._bindFiltros();
  }

  _template(d) {
    if (!d.opcoes || d.opcoes.length === 0) {
      return _estadoVazioOpcoes(d) + _avisosPedagogicos();
    }

    const calls = d.opcoes.filter((o) => o.bdi === '12' || o.bdi === 12);
    const puts  = d.opcoes.filter((o) => o.bdi === '14' || o.bdi === 14);

    const vencimentos = [...new Set(d.opcoes.map((o) => o.data_vencimento).filter(Boolean))].sort();

    const dataPregao = d.opcoes[0]?.data_pregao
      ? new Date(d.opcoes[0].data_pregao + 'T00:00:00').toLocaleDateString('pt-BR')
      : '';

    return `
      ${d.status === 'TICKER_NORMALIZADO' ? _avisoStatus(d) : ''}
      <p class="text-muted small mb-2">Pregão: ${dataPregao} &nbsp;·&nbsp; ${d.opcoes.length} série(s)</p>
      ${_barraFiltros(vencimentos)}
      <div data-tabelas>
        ${_renderTabelas(calls, puts, this._filtros)}
      </div>
      ${_avisosPedagogicos()}
    `;
  }

  _bindFiltros() {
    const form = this.querySelector('[data-filtros]');
    if (!form) return;
    form.addEventListener('change', () => {
      this._filtros = {
        vencimento: form.querySelector('[data-filtro-vencimento]')?.value || '',
        tipo:       form.querySelector('[data-filtro-tipo]')?.value || '',
        moneyness:  form.querySelector('[data-filtro-moneyness]')?.value || '',
        minNegocios: Number(form.querySelector('[data-filtro-min-negocios]')?.value || 0),
      };
      this._atualizarTabelas();
    });
  }

  _atualizarTabelas() {
    const d = this._dados;
    if (!d?.opcoes) return;
    const calls = d.opcoes.filter((o) => o.bdi === '12' || o.bdi === 12);
    const puts  = d.opcoes.filter((o) => o.bdi === '14' || o.bdi === 14);
    const el = this.querySelector('[data-tabelas]');
    if (el) el.innerHTML = _renderTabelas(calls, puts, this._filtros);
  }
}

// OPT-PAI-3: barra de filtros — vencimento, tipo, moneyness, minimo de negocios.
function _barraFiltros(vencimentos) {
  const optsVenc = vencimentos
    .map((v) => `<option value="${escaparHtml(v)}">${_fmtData(v)}</option>`)
    .join('');
  return `
    <div data-filtros class="row g-2 mb-3 align-items-end">
      <div class="col-auto">
        <label class="form-label mb-1 small">Vencimento</label>
        <select data-filtro-vencimento class="form-select form-select-sm" style="min-width:130px">
          <option value="">Todos</option>
          ${optsVenc}
        </select>
      </div>
      <div class="col-auto">
        <label class="form-label mb-1 small">Tipo</label>
        <select data-filtro-tipo class="form-select form-select-sm">
          <option value="">Todos</option>
          <option value="CALL">CALL</option>
          <option value="PUT">PUT</option>
        </select>
      </div>
      <div class="col-auto">
        <label class="form-label mb-1 small">Moneyness</label>
        <select data-filtro-moneyness class="form-select form-select-sm">
          <option value="">Todos</option>
          <option value="ITM">ITM</option>
          <option value="ATM">ATM</option>
          <option value="OTM">OTM</option>
        </select>
      </div>
      <div class="col-auto">
        <label class="form-label mb-1 small">Mín. negócios</label>
        <input data-filtro-min-negocios type="number" min="0" step="1" value="0"
          class="form-control form-control-sm" style="width:90px">
      </div>
    </div>
  `;
}

function _renderTabelas(calls, puts, filtros) {
  const callsFilt = _filtrar(calls, 'CALL', filtros);
  const putsFilt  = _filtrar(puts,  'PUT',  filtros);
  const semCall = filtros.tipo !== 'PUT' && !callsFilt.length
    ? '<p class="text-muted small">Sem CALLs para os filtros selecionados.</p>' : '';
  const semPut = filtros.tipo !== 'CALL' && !putsFilt.length
    ? '<p class="text-muted small">Sem PUTs para os filtros selecionados.</p>' : '';
  const tabelaCalls = callsFilt.length ? _tabelaOpcoes(callsFilt, 'CALL') : semCall;
  const tabelaPuts  = putsFilt.length  ? _tabelaOpcoes(putsFilt,  'PUT')  : semPut;
  return tabelaCalls + tabelaPuts;
}

function _filtrar(opcoes, tipo, filtros) {
  if (filtros.tipo && filtros.tipo !== tipo) return [];
  return opcoes.filter((o) => {
    if (filtros.vencimento && o.data_vencimento !== filtros.vencimento) return false;
    if (filtros.minNegocios > 0 && Number(o.numero_negocios ?? -1) < filtros.minNegocios) return false;
    if (filtros.moneyness) {
      const exercicio = Number(o.preco_exercicio ?? 0);
      const medio = Number(o.preco_medio ?? o.fechamento ?? 0);
      if (_moneyness(tipo, exercicio, medio).rotulo !== filtros.moneyness) return false;
    }
    return true;
  });
}

// OPT-PAI-4: avisos pedagogicos de risco e qualidade.
// Explica os 6 fatores que opções exigem; colapso por padrão para não poluir.
// A secao "cadeia incompleta bloqueia assertividade" e sempre visivel.
function _avisosPedagogicos() {
  return `
    <div class="mt-4 border rounded p-3 bg-light small">
      <div class="alert alert-warning py-2 mb-2" role="alert">
        <strong>Cadeia incompleta bloqueia assertividade:</strong>
        quando a base de opções está contaminada, em saneamento ou sem validação
        por ativo-objeto, nenhuma leitura de gregas, payoff ou probabilidade deve
        ser usada para decisões operacionais.
      </div>
      <button class="btn btn-link btn-sm p-0 text-secondary fw-semibold" type="button"
        data-bs-toggle="collapse" data-bs-target="#dica-opcoes" aria-expanded="false">
        ℹ Entenda os riscos antes de interpretar opções
      </button>
      <div id="dica-opcoes" class="collapse mt-2">
        <p class="mb-2 text-muted">
          <strong>Opções exigem atenção a seis fatores antes de qualquer leitura:</strong>
        </p>
        <dl class="row mb-0">
          <dt class="col-sm-3">Liquidez</dt>
          <dd class="col-sm-9">Volume de negócios e contratos em aberto determinam se você consegue entrar e sair.
            Séries com poucos negócios têm spread bid/ask largo — o custo real pode ser muito maior que o prêmio listado.</dd>
          <dt class="col-sm-3">Vencimento</dt>
          <dd class="col-sm-9">Opções perdem valor com a passagem do tempo (theta).
            Séries com vencimento próximo têm decaimento acelerado; nunca compare prêmios de séries
            com vencimentos diferentes sem ajustar o horizonte.</dd>
          <dt class="col-sm-3">Strike</dt>
          <dd class="col-sm-9">A distância do exercício ao preço do ativo (moneyness) define o perfil de risco.
            OTM é mais barato mas tem menor probabilidade de exercício;
            ITM reflete prêmio intrínseco real.</dd>
          <dt class="col-sm-3">Custo do prêmio</dt>
          <dd class="col-sm-9">O prêmio pago é o risco máximo do comprador — mas para o lançador o risco pode ser
            ilimitado (CALL descoberta). Considere o custo como percentual do ativo-objeto.</dd>
          <dt class="col-sm-3">Spread bid/ask</dt>
          <dd class="col-sm-9">Séries ilíquidas têm spread elevado.
            O preço médio exibido aqui é do último negócio, não do livro de ofertas atual;
            a execução real pode diferir.</dd>
          <dt class="col-sm-3">Payoff assimétrico</dt>
          <dd class="col-sm-9">O ganho máximo (comprador) ou a perda máxima (lançador) são assimétricos.
            Analise o payoff ao vencimento (curva break-even) antes de qualquer decisão.</dd>
        </dl>
      </div>
    </div>
  `;
}

function _estadoVazioOpcoes(d = {}) {
  const status = STATUS_OPCOES[d.status] || STATUS_OPCOES.SEM_CADEIA_VALIDA;
  const solicitado = d.simboloSolicitado || d.simbolo || '';
  const canonico = d.simboloCanonico || solicitado;
  const motivo = d.motivo || 'Não há cadeia de opções válida carregada para este ativo no último pregão.';
  const alias = d.aliasAplicado && solicitado && canonico && solicitado !== canonico;
  return `
    <div class="alert alert-${status.classe} mb-0" role="status">
      <div class="d-flex flex-wrap justify-content-between gap-2">
        <strong>${escaparHtml(status.titulo)}</strong>
        ${d.status ? `<span class="badge text-bg-light">${escaparHtml(d.status)}</span>` : ''}
      </div>
      <p class="mb-2">${escaparHtml(motivo)}</p>
      <dl class="row small mb-2">
        ${solicitado ? `<dt class="col-sm-3">Solicitado</dt><dd class="col-sm-9">${escaparHtml(solicitado)}</dd>` : ''}
        ${canonico ? `<dt class="col-sm-3">Canônico</dt><dd class="col-sm-9">${escaparHtml(canonico)}${alias ? ' <span class="badge text-bg-info">normalizado</span>' : ''}</dd>` : ''}
      </dl>
      <p class="small mb-0"><strong>Próximo passo:</strong> ${escaparHtml(status.proximo)}</p>
    </div>
  `;
}

function _avisoStatus(d = {}) {
  const status = STATUS_OPCOES[d.status];
  if (!status) return '';
  return `<div class="alert alert-${status.classe} py-2 small" role="status">
    <strong>${escaparHtml(status.titulo)}.</strong> ${escaparHtml(d.motivo || status.proximo)}
  </div>`;
}

function _tabelaOpcoes(opcoes, tipo) {
  const cor = tipo === 'CALL' ? 'text-success' : 'text-danger';
  const linhas = opcoes.map((o) => {
    const exercicio = Number(o.preco_exercicio ?? 0);
    const medio = Number(o.preco_medio ?? o.fechamento ?? 0);
    const moneyness = _moneyness(tipo, exercicio, medio);
    return `<tr class="${moneyness.classe}">
      <td class="fw-semibold">${escaparHtml(o.simbolo)}</td>
      <td>${_fmtData(o.data_vencimento)}</td>
      <td class="text-end">${_fmtMoeda(exercicio)}</td>
      <td class="text-end">${_fmtMoeda(o.fechamento)}</td>
      <td class="text-end">${_fmtMoeda(medio)}</td>
      <td class="text-end">${_fmtInt(o.numero_negocios)}</td>
      <td><span class="badge ${moneyness.badgeCls}">${moneyness.rotulo}</span></td>
    </tr>`;
  }).join('');

  return `
    <h6 class="${cor} mt-3">${tipo}</h6>
    <div class="table-responsive mb-3">
      <table class="table table-sm table-hover small align-middle">
        <thead>
          <tr>
            <th>Símbolo</th>
            <th>Vencimento</th>
            <th class="text-end">Exercício</th>
            <th class="text-end">Fechamento</th>
            <th class="text-end">Preço médio</th>
            <th class="text-end">Negócios</th>
            <th>Moneyness</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function _moneyness(tipo, exercicio, premioOuFechamento) {
  // Sem o spot, classificamos pelo preco_exercicio vs preco_medio da opcao
  // apenas para dar uma referencia visual (nao e moneyness rigoroso sem o spot).
  if (!exercicio || !premioOuFechamento) {
    return { rotulo: '—', classe: '', badgeCls: 'bg-secondary' };
  }
  const razao = Math.abs(exercicio - premioOuFechamento) / exercicio;
  if (razao < 0.05) return { rotulo: 'ATM', classe: '', badgeCls: 'bg-warning text-dark' };
  if (tipo === 'CALL') {
    return exercicio < premioOuFechamento
      ? { rotulo: 'ITM', classe: 'table-success', badgeCls: 'bg-success' }
      : { rotulo: 'OTM', classe: 'table-secondary', badgeCls: 'bg-secondary' };
  }
  return exercicio > premioOuFechamento
    ? { rotulo: 'ITM', classe: 'table-success', badgeCls: 'bg-success' }
    : { rotulo: 'OTM', classe: 'table-secondary', badgeCls: 'bg-secondary' };
}

function _fmtMoeda(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '—';
  return `R$ ${Number(v).toFixed(2)}`;
}

function _fmtInt(v) {
  if (v == null) return '—';
  return Number(v).toLocaleString('pt-BR');
}

function _fmtData(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${ano}`;
}

customElements.define('opcoes-painel', OpcoesPainel);
