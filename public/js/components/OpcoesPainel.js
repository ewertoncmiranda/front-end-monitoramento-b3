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

const REC_CLASSE = {
  COMPRA_FORTE: 'success', COMPRA_MODERADA: 'success',
  MANTER: 'secondary', ALERTA_RISCO: 'warning', VENDA_VALUATION: 'danger',
};

// Responsabilidade: renderizar cadeia de opcoes com:
//   OPT-PAI-1/2: estados explicados e saude
//   OPT-PAI-3: filtros interativos (vencimento, tipo, moneyness, min negocios)
//   OPT-PAI-4: avisos pedagogicos
//   Cruzamento 1: moneyness real via precoAtual do ativo-objeto
//   Cruzamento 2: card contexto (preco, range, Graham, recomendacao, volatilidade)
//   Cruzamento 3: colunas Distancia e Break-even na tabela
export class OpcoesPainel extends BaseComponent {
  constructor() {
    super();
    this._filtros = { vencimento: '', tipo: '', minNegocios: 0, minVolume: 0, minLiquidez: 0, maxDistancia: '' };
    this._dados = null;
  }

  setDados(dados) {
    this._dados = dados;
    this._filtros = { vencimento: '', tipo: '', minNegocios: 0, minVolume: 0, minLiquidez: 0, maxDistancia: '' };
    this.innerHTML = dados ? this._template(dados) : '';
    this._bindFiltros();
  }

  _template(d) {
    const ctx = d.contexto || null;

    if (!d.opcoes || d.opcoes.length === 0) {
      return _cardContexto(ctx) + _estadoVazioOpcoes(d) + _avisosPedagogicos();
    }

    const calls = d.opcoes.filter((o) => o.bdi === '12' || o.bdi === 12);
    const puts  = d.opcoes.filter((o) => o.bdi === '14' || o.bdi === 14);
    const vencimentos = [...new Set(d.opcoes.map((o) => o.data_vencimento).filter(Boolean))].sort();

    const dataPregao = d.opcoes[0]?.data_pregao
      ? new Date(d.opcoes[0].data_pregao + 'T00:00:00').toLocaleDateString('pt-BR')
      : '';

    return `
      ${_cardContexto(ctx)}
      ${d.status === 'TICKER_NORMALIZADO' ? _avisoStatus(d) : ''}
      <p class="text-muted small mb-2">Pregão: ${dataPregao} &nbsp;·&nbsp; ${d.opcoes.length} série(s)</p>
      ${_barraFiltros(vencimentos)}
      <div data-tabelas>
        ${_renderTabelas(calls, puts, this._filtros, ctx?.precoAtual)}
      </div>
      ${_avisosPedagogicos()}
    `;
  }

  _bindFiltros() {
    const form = this.querySelector('[data-filtros]');
    if (!form) return;
    form.addEventListener('change', () => {
      this._filtros = {
        vencimento:   form.querySelector('[data-filtro-vencimento]')?.value || '',
        tipo:         form.querySelector('[data-filtro-tipo]')?.value || '',
        minNegocios:  Number(form.querySelector('[data-filtro-min-negocios]')?.value || 0),
        minVolume:    Number(form.querySelector('[data-filtro-min-volume]')?.value || 0),
        minLiquidez:  Number(form.querySelector('[data-filtro-min-liquidez]')?.value || 0),
        maxDistancia: form.querySelector('[data-filtro-max-distancia]')?.value ?? '',
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
    if (el) el.innerHTML = _renderTabelas(calls, puts, this._filtros, d.contexto?.precoAtual);
  }
}

// ── Cruzamento 2: card contexto do ativo-objeto ────────────────────────────────
function _cardContexto(ctx) {
  if (!ctx?.precoAtual) return '';

  const preco = `R$ ${ctx.precoAtual.toFixed(2)}`;
  const varSinal = (ctx.variacaoDia ?? 0) >= 0 ? '+' : '';
  const varCls   = (ctx.variacaoDia ?? 0) >= 0 ? 'text-success' : 'text-danger';
  const varStr = ctx.variacaoDia != null
    ? `<span class="${varCls} small">${varSinal}${(ctx.variacaoDia * 100).toFixed(2)}%</span>`
    : '';

  // barra de posicao no range 63 dias
  const rangePct = ctx.posicaoRange != null ? Math.min(100, Math.max(0, Math.round(ctx.posicaoRange * 100))) : null;
  const minTitle = ctx.dataMinima ? `mínima 63d — ${_fmtData(ctx.dataMinima)}` : 'mínima 63d';
  const maxTitle = ctx.dataMaxima ? `máxima 63d — ${_fmtData(ctx.dataMaxima)}` : 'máxima 63d';
  const rangeBar = rangePct != null ? `
    <div class="d-flex align-items-center gap-2 mt-2 small text-muted">
      <span title="${minTitle}">${_fmtMoeda(ctx.min63d)}</span>
      <div class="progress flex-grow-1" style="height:5px" title="${rangePct}% no range 63d">
        <div class="progress-bar" style="width:${rangePct}%"></div>
      </div>
      <span title="${maxTitle}">${_fmtMoeda(ctx.max63d)}</span>
      <span class="badge text-bg-secondary">${rangePct}%&nbsp;range&nbsp;63d</span>
    </div>` : '';

  const recCls = REC_CLASSE[ctx.recomendacao] || 'secondary';
  const recBadge = ctx.recomendacao
    ? `<span class="badge text-bg-${recCls}">${escaparHtml(ctx.recomendacao.replace(/_/g, ' '))}</span>`
    : '';
  const dataAnaliseStr = ctx.dataAnalise
    ? `<span class="text-muted small" title="data da análise">análise ${escaparHtml(_fmtData(String(ctx.dataAnalise).slice(0, 10)))}</span>`
    : '';

  const stats = [
    ctx.lpa   != null ? `LPA R$${ctx.lpa.toFixed(2)}`                : null,
    ctx.vpa   != null ? `VPA R$${ctx.vpa.toFixed(2)}`                : null,
    ctx.pl    != null ? `P/L ${ctx.pl.toFixed(1)}×`                  : null,
    ctx.graham!= null ? `Graham R$${ctx.graham.toFixed(2)}`          : null,
    ctx.margem!= null ? `Margem ${ctx.margem.toFixed(1)}%`           : null,
    ctx.vol21d!= null ? `Vol.21d ${(ctx.vol21d * 100).toFixed(1)}%`  : null,
    ctx.atr14 != null ? `ATR14 R$${ctx.atr14.toFixed(2)}`           : null,
    ctx.volRelativo != null ? `Vol.rel. ${ctx.volRelativo.toFixed(2)}×` : null,
    ctx.ticketMedio != null ? `Ticket R$${ctx.ticketMedio.toFixed(2)}` : null,
    ctx.amplitudeDia != null ? `Amp. ${(ctx.amplitudeDia * 100).toFixed(1)}%` : null,
    ctx.retornoIntraday != null ? `Intraday ${ctx.retornoIntraday >= 0 ? '+' : ''}${(ctx.retornoIntraday * 100).toFixed(1)}%` : null,
    ctx.gapAbertura != null ? `Gap ${ctx.gapAbertura >= 0 ? '+' : ''}${(ctx.gapAbertura * 100).toFixed(1)}%` : null,
    ctx.posicaoRangeDia != null ? `Pos.dia ${Math.round(ctx.posicaoRangeDia * 100)}%` : null,
    ctx.volumeContratos21d != null ? `Contr.21d ${_fmtK(ctx.volumeContratos21d)}` : null,
    ctx.negocios21d != null ? `Neg.21d ${_fmtK(ctx.negocios21d)}` : null,
    ctx.variacaoPeriodo != null ? `Var.63d ${ctx.variacaoPeriodo >= 0 ? '+' : ''}${(ctx.variacaoPeriodo * 100).toFixed(1)}%` : null,
  ].filter(Boolean).map((s) => `<span class="text-muted small">${escaparHtml(s)}</span>`).join('');

  const avisoSaltos = _avisoSaltos(ctx.saltos);
  const avisoProventos = _avisoProventos(ctx.exDividendos);

  return `
    <div class="card mb-3 border-0 bg-light">
      <div class="card-body py-2 px-3">
        <div class="d-flex flex-wrap align-items-baseline gap-3">
          <span class="fw-bold fs-5">${preco}</span>
          ${varStr}
          ${recBadge}
          ${dataAnaliseStr}
          ${stats}
        </div>
        ${rangeBar}
        ${avisoSaltos}
        ${avisoProventos}
      </div>
    </div>
  `;
}

// ── Aviso: saltos de desdobramento/grupamento na série ────────────────────────
function _avisoSaltos(saltos) {
  if (!saltos?.length) return '';
  const fmt = saltos.map((s) => {
    const [ano, mes, dia] = String(s.data).split('-');
    const pct = s.variacao != null ? ` (${(s.variacao * 100).toFixed(1)}%)` : '';
    const precos = (s.fechamentoAnterior != null && s.abertura != null)
      ? `R$${s.fechamentoAnterior.toFixed(2)} → R$${s.abertura.toFixed(2)}`
      : '';
    const item = precos ? `${precos}${pct} em ${dia}/${mes}/${ano}` : `${pct} em ${dia}/${mes}/${ano}`.trim();
    return escaparHtml(item);
  }).join('; ');
  return `<div class="alert alert-info py-1 px-2 mt-2 mb-0 small" role="alert">
    <strong>Atenção: série histórica com salto(s)</strong> — ${fmt}.
    Desdobramento ou grupamento detectado — a série de preços brutos não está ajustada.
  </div>`;
}

// ── Aviso: ex-dividendo antes do vencimento de opções ─────────────────────────
function _avisoProventos(exDividendos) {
  if (!exDividendos?.length) return '';
  const itens = exDividendos.map((p) => {
    const [ano, mes, dia] = String(p.data).split('-');
    const val = p.valor > 0 ? ` R$${p.valor.toFixed(4)}` : '';
    return `${escaparHtml(p.tipo)}${escaparHtml(val)} em ${dia}/${mes}/${ano}`;
  }).join('; ');
  return `<div class="alert alert-warning py-1 px-2 mt-2 mb-0 small" role="alert">
    <strong>Ex-dividendo recente/futuro:</strong> ${itens}.
    Proventos antes do vencimento reduzem o preço do ativo-objeto e distorcem o prêmio das CALLs.
  </div>`;
}

// ── OPT-PAI-3: barra de filtros ───────────────────────────────────────────────
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
        <label class="form-label mb-1 small">Mín. negócios</label>
        <input data-filtro-min-negocios type="number" min="0" step="1" value="0"
          class="form-control form-control-sm" style="width:90px"
          title="Exibe apenas opções com pelo menos N negócios no pregão. Sem dado passa pelo filtro.">
      </div>
      <div class="col-auto">
        <label class="form-label mb-1 small">Volume mín. (contratos)</label>
        <input data-filtro-min-volume type="number" min="0" step="1" value="0"
          class="form-control form-control-sm" style="width:110px"
          title="Exibe apenas opções com volume de contratos ≥ N. Sem dado passa pelo filtro.">
      </div>
      <div class="col-auto">
        <label class="form-label mb-1 small">Liquidez mín. (R$)</label>
        <input data-filtro-min-liquidez type="number" min="0" step="1000" value="0"
          class="form-control form-control-sm" style="width:120px"
          title="Exibe apenas opções com volume financeiro ≥ R$ N. Sem dado passa pelo filtro.">
      </div>
      <div class="col-auto">
        <label class="form-label mb-1 small">Distância máx. strike (%)</label>
        <input data-filtro-max-distancia type="number" min="0" step="1" value=""
          placeholder="—" class="form-control form-control-sm" style="width:110px"
          title="Exibe apenas opções cujo strike está a no máximo N% do preço atual. Requer preço do ativo-objeto. Sem dado passa pelo filtro.">
      </div>
    </div>
  `;
}

function _renderTabelas(calls, puts, filtros, precoAtual) {
  const callsFilt = _filtrar(calls, 'CALL', filtros, precoAtual);
  const putsFilt  = _filtrar(puts,  'PUT',  filtros, precoAtual);

  const total    = calls.length + puts.length;
  const filtrado = callsFilt.length + putsFilt.length;
  const contagem = `<p class="text-muted small mb-2">
    <strong>${filtrado}</strong> de <strong>${total}</strong> opções
  </p>`;

  if (filtrado === 0) {
    return contagem + `<div class="alert alert-secondary" role="status">
      Nenhuma opção atende aos filtros selecionados.
    </div>`;
  }

  const semCall = filtros.tipo !== 'PUT' && !callsFilt.length
    ? '<p class="text-muted small">Sem CALLs para os filtros selecionados.</p>' : '';
  const semPut = filtros.tipo !== 'CALL' && !putsFilt.length
    ? '<p class="text-muted small">Sem PUTs para os filtros selecionados.</p>' : '';
  const tabelaCalls = callsFilt.length ? _tabelaOpcoes(callsFilt, 'CALL', precoAtual) : semCall;
  const tabelaPuts  = putsFilt.length  ? _tabelaOpcoes(putsFilt,  'PUT',  precoAtual) : semPut;
  return contagem + tabelaCalls + tabelaPuts;
}

function _filtrar(opcoes, tipo, filtros, precoAtual) {
  if (filtros.tipo && filtros.tipo !== tipo) return [];
  return opcoes.filter((o) => {
    if (filtros.vencimento && o.data_vencimento !== filtros.vencimento) return false;

    // null passes all numeric filters (shown as "sem dado" but not excluded)
    if (filtros.minNegocios > 0 && o.numero_negocios != null
        && Number(o.numero_negocios) < filtros.minNegocios) return false;

    if (filtros.minVolume > 0 && o.volume != null
        && Number(o.volume) < filtros.minVolume) return false;

    if (filtros.minLiquidez > 0 && o.volume_financeiro != null
        && Number(o.volume_financeiro) < filtros.minLiquidez) return false;

    if (filtros.maxDistancia !== '' && filtros.maxDistancia !== null) {
      const maxDist = Number(filtros.maxDistancia);
      if (!isNaN(maxDist) && maxDist >= 0 && precoAtual && precoAtual > 0
          && o.preco_exercicio != null) {
        const dist = Math.abs(Number(o.preco_exercicio) - precoAtual) / precoAtual * 100;
        if (dist > maxDist) return false;
      }
    }

    return true;
  });
}

// ── OPT-PAI-4: avisos pedagógicos ─────────────────────────────────────────────
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

// ── Cruzamento 3: tabela com colunas Distância e Break-even ───────────────────
function _tabelaOpcoes(opcoes, tipo, precoAtual) {
  const cor = tipo === 'CALL' ? 'text-success' : 'text-danger';
  const temPreco = precoAtual != null && precoAtual > 0;

  const linhas = opcoes.map((o) => {
    const exercicio = Number(o.preco_exercicio ?? 0);
    const medio     = Number(o.preco_medio ?? o.fechamento ?? 0);
    const premio    = Number(o.preco_medio ?? o.fechamento ?? 0);
    const moneyness = _moneyness(tipo, exercicio, medio, precoAtual);

    // Cruzamento 1: distancia real do strike ao preco do ativo-objeto
    const distPerc = temPreco && exercicio
      ? ((exercicio - precoAtual) / precoAtual) * 100
      : null;
    const distStr = distPerc != null
      ? `<span class="${distPerc >= 0 ? 'text-danger' : 'text-success'}">${distPerc >= 0 ? '+' : ''}${distPerc.toFixed(1)}%</span>`
      : '—';

    // Cruzamento 3: break-even ao vencimento
    const breakeven = exercicio && premio
      ? (tipo === 'CALL' ? exercicio + premio : exercicio - premio)
      : null;

    return `<tr class="${moneyness.classe}">
      <td class="fw-semibold">${escaparHtml(o.simbolo)}</td>
      <td>${_fmtData(o.data_vencimento)}</td>
      <td class="text-end">${_fmtMoeda(exercicio)}</td>
      <td class="text-end">${distStr}</td>
      <td class="text-end">${_fmtMoeda(o.fechamento)}</td>
      <td class="text-end">${_fmtMoeda(medio)}</td>
      <td class="text-end">${_fmtMoeda(breakeven)}</td>
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
            <th class="text-end" title="(Strike − Preço atual) / Preço atual">Distância</th>
            <th class="text-end">Fechamento</th>
            <th class="text-end">Prêmio médio</th>
            <th class="text-end" title="Strike ± prêmio: ponto de equilíbrio ao vencimento">Break-even</th>
            <th class="text-end">Negócios</th>
            <th>Moneyness</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

// ── Cruzamento 1: moneyness real ───────────────────────────────────────────────
// Usa precoAtual do ativo-objeto quando disponivel; fallback ao proxy anterior.
function _moneyness(tipo, exercicio, premioOuFechamento, precoAtual) {
  if (!exercicio) return { rotulo: '—', classe: '', badgeCls: 'bg-secondary' };

  if (precoAtual) {
    const diff = exercicio - precoAtual;
    const atm = Math.abs(diff) / precoAtual < 0.02;
    if (atm) return { rotulo: 'ATM', classe: '', badgeCls: 'bg-warning text-dark' };
    if (tipo === 'CALL') {
      return diff < 0
        ? { rotulo: 'ITM', classe: 'table-success', badgeCls: 'bg-success' }
        : { rotulo: 'OTM', classe: 'table-secondary', badgeCls: 'bg-secondary' };
    }
    return diff > 0
      ? { rotulo: 'ITM', classe: 'table-success', badgeCls: 'bg-success' }
      : { rotulo: 'OTM', classe: 'table-secondary', badgeCls: 'bg-secondary' };
  }

  // Fallback: proxy via preco_medio da opcao
  if (!premioOuFechamento) return { rotulo: '—', classe: '', badgeCls: 'bg-secondary' };
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

function _fmtK(v) {
  if (v == null) return '—';
  const n = Number(v);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}

function _fmtData(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${ano}`;
}

customElements.define('opcoes-painel', OpcoesPainel);
