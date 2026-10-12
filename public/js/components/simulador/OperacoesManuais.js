import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { ESTRATEGIAS_PADRAO, htmlComboboxAtivo, classeValor } from './utils.js';

const SEM = '—';

const VERSOES_ESTRATEGIA = ESTRATEGIAS_PADRAO.map((e) => `${e}_v1`);

// 12: tempo decorrido desde a data de entrada
function diasDecorridos(dataEntrada) {
  if (!dataEntrada) return '';
  const diff = Math.round((Date.now() - new Date(dataEntrada)) / 86_400_000);
  if (diff < 0) return `· abre em ${Math.abs(diff)} dia(s)`;
  if (diff === 0) return '· hoje';
  return `· há ${diff} dia(s)`;
}

// 13: mini sparkline SVG da curva de retorno acumulado
function sparklineSvg(pontos, larg = 80, alt = 22) {
  if (!pontos?.length || pontos.length < 2) return '';
  const vals = pontos.map((p) => Number(p.retornoAcumPct || 0));
  const minV = Math.min(...vals, 0);
  const maxV = Math.max(...vals, 0);
  const range = maxV - minV || 0.0001;
  const xs = (i) => Math.round(i / (vals.length - 1) * larg);
  const ys = (v) => Math.round((1 - (v - minV) / range) * (alt - 3)) + 1;
  const pts = vals.map((v, i) => `${xs(i)},${ys(v)}`).join(' ');
  const zerY = ys(0);
  const cor = vals.at(-1) >= 0 ? '#28a745' : '#dc3545';
  return `<svg width="${larg}" height="${alt}" viewBox="0 0 ${larg} ${alt}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;overflow:visible">
    <line x1="0" y1="${zerY}" x2="${larg}" y2="${zerY}" stroke="#ccc" stroke-width="0.5" stroke-dasharray="2,2"/>
    <polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

export function htmlHistoricoOperacao(historico, versaoEstrategia = null) {
  if (!historico) return '<p class="small text-muted">Sem dados de histórico.</p>';

  const { precoEntrada, totalRetornoPct, totalPnlRs, pontos = [] } = historico;
  const classeTotal = classeValor(totalRetornoPct);
  const resumo = `
    <div class="d-flex flex-wrap gap-3 mb-2 small">
      <span>Entrada: <strong>${escaparHtml(formatarMoeda(precoEntrada, SEM))}</strong></span>
      <span>Retorno: <strong class="${classeTotal}">${escaparHtml(formatarPercentual(totalRetornoPct, 2, { sinal: true, vazio: SEM }))}</strong></span>
      <span>P&amp;L: <strong class="${classeTotal}">${escaparHtml(formatarMoeda(totalPnlRs, SEM))}</strong></span>
      <span>${pontos.length} pregão(ões)</span>
    </div>`;

  if (!pontos.length) return resumo + '<p class="small text-muted">Nenhuma cotação disponível para o período.</p>';

  // Coleta todas as estratégias presentes no histórico
  const estrategias = [...new Set(pontos.flatMap((p) => Object.keys(p.quintilPorEstrategia || {})))].sort();

  const thEstrategias = estrategias.map((e) => {
    const destaque = versaoEstrategia && e === versaoEstrategia;
    return `<th class="small ${destaque ? 'text-primary fw-semibold' : 'fw-normal text-muted'} text-center">${escaparHtml(e.replace(/_v\d+$/, '').replace(/_/g, ' '))}${destaque ? ' ◀' : ''}</th>`;
  }).join('');

  const linhas = pontos.map((p) => {
    const classeDia = classeValor(p.retornoDiaPct);
    const classeAcum = classeValor(p.retornoAcumPct);
    const tdQuintis = estrategias.map((e) => {
      const q = p.quintilPorEstrategia?.[e];
      const destaque = versaoEstrategia && e === versaoEstrategia;
      return `<td class="text-center small${destaque ? ' fw-bold text-primary' : ''}">${q != null ? q : SEM}</td>`;
    }).join('');
    return `<tr>
      <td class="text-nowrap small">${escaparHtml(formatarData(p.dataPregao))}</td>
      <td class="text-end small">${escaparHtml(formatarMoeda(p.preco, SEM))}</td>
      <td class="text-end small ${classeDia}">${escaparHtml(formatarPercentual(p.retornoDiaPct, 2, { sinal: true, vazio: SEM }))}</td>
      <td class="text-end small ${classeAcum}">${escaparHtml(formatarPercentual(p.retornoAcumPct, 2, { sinal: true, vazio: SEM }))}</td>
      <td class="text-end small ${classeAcum}">${escaparHtml(formatarMoeda(p.pnlRs, SEM))}</td>
      ${tdQuintis}
    </tr>`;
  }).join('');

  return `${resumo}
    <div class="table-responsive" style="max-height:300px;overflow-y:auto">
      <table class="table table-sm table-hover mb-0">
        <thead style="position:sticky;top:0;background:var(--bs-body-bg,#fff)">
          <tr>
            <th class="small fw-normal text-muted">Data</th>
            <th class="small fw-normal text-muted text-end">Preço</th>
            <th class="small fw-normal text-muted text-end">Dia %</th>
            <th class="small fw-normal text-muted text-end">Acum %</th>
            <th class="small fw-normal text-muted text-end">P&amp;L R$</th>
            ${thEstrategias}
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

const STATUS_LISTA = ['PENDENTE', 'ABERTA', 'FECHADA'];

// melhoria 2: estratégia vira select com todas as versões conhecidas
function opcoesVersao() {
  return VERSOES_ESTRATEGIA.map((v) => {
    const rotulo = v.replace(/_v(\d+)$/, ' v$1').replace(/_/g, ' ');
    return `<option value="${escaparHtml(v)}">${escaparHtml(rotulo)}</option>`;
  }).join('');
}

// melhoria 1: formulário em seção colapsável distinta da listagem
function htmlFormulario(ativos) {
  return `
    <details class="mb-3">
      <summary class="btn btn-outline-primary btn-sm mb-0"
               style="display:inline-flex;align-items:center;gap:4px;list-style:none;cursor:pointer;">
        + Nova operação
      </summary>
      <div class="border rounded p-3 mt-2">
        <form id="form-operacao" class="row g-2">
          <div class="col-md-3">
            <label class="form-label small mb-1" for="operacao-ativo">Ativo</label>
            ${htmlComboboxAtivo('operacao-ativo', ativos, { placeholder: 'Ativo…' })}
          </div>
          <div class="col-md-3">
            <label class="form-label small mb-1" for="operacao-data">Data de entrada</label>
            <input id="operacao-data" type="date" class="form-control form-control-sm" required>
          </div>
          <div class="col-md-2">
            <label class="form-label small mb-1" for="operacao-capital">Capital (R$)</label>
            <input id="operacao-capital" type="number" min="1" value="10000"
                   class="form-control form-control-sm" required>
          </div>
          <div class="col-md-3">
            <label class="form-label small mb-1" for="operacao-versao">Estratégia</label>
            <select id="operacao-versao" class="form-select form-select-sm" required>
              ${opcoesVersao()}
            </select>
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <button type="submit" class="btn btn-primary btn-sm w-100">Criar</button>
          </div>
        </form>
      </div>
    </details>`;
}

// melhoria 5: filtro por status
function htmlFiltros(filtroStatus) {
  const btnTodas = `<button type="button"
    class="btn btn-sm ${filtroStatus === '' ? 'btn-secondary' : 'btn-outline-secondary'}"
    data-filtro-status="">Todas</button>`;
  const btnStatus = STATUS_LISTA.map((s) =>
    `<button type="button"
      class="btn btn-sm ${filtroStatus === s ? 'btn-primary' : 'btn-outline-secondary'}"
      data-filtro-status="${s}">${s}</button>`
  ).join('');
  return `<div class="d-flex gap-2 align-items-center mb-3 flex-wrap">
    <span class="small text-muted">Status:</span>
    ${btnTodas}${btnStatus}
  </div>`;
}

export function htmlOperacoes(operacoes = [], ativos = [], filtroStatus = '', historicosPorOperacao = {}) {
  if (operacoes && !Array.isArray(operacoes)) operacoes = operacoes.itens || operacoes.operacoes || [];

  const form = htmlFormulario(ativos);
  const filtros = htmlFiltros(filtroStatus);
  const lista = filtroStatus
    ? operacoes.filter((o) => (o.status || '') === filtroStatus)
    : operacoes;

  if (!lista.length) {
    const msg = filtroStatus
      ? `Nenhuma operação com status ${filtroStatus}.`
      : 'Nenhuma operação manual cadastrada.';
    return `${form}${filtros}<p class="small text-muted">${msg}</p>`;
  }

  const itens = lista.map((o) => {
    const diarios = o.diarios || o.historico || [];
    const pnl = diarios.at(-1)?.pnlRs ?? o.pnlRs;
    const acum = diarios.at(-1)?.retornoAcumPct ?? o.retornoAcumPct;
    const status = o.status || SEM;
    // 11: historico auto-carregado para mostrar P&L inline
    const historicoInline = historicosPorOperacao[o.id];

    const resumoStatus = status === 'PENDENTE'
      ? `Abertura estimada: ${escaparHtml(formatarData(o.dataAberturaEstimada || o.dataEntrada, SEM))}`
      : status === 'FECHADA'
        ? `Retorno vs CDI: ${escaparHtml(formatarPercentual(o.retornoVsCdi ?? o.excessoCdi, 2, { sinal: true, vazio: SEM }))}`
        : 'Em andamento';

    const hoje = new Date().toISOString().slice(0, 10);
    const temDesempenho = o.dataEntrada && String(o.dataEntrada) <= hoje;

    // 2: badge da estratégia de entrada
    const versao = o.versaoEstrategia || '';
    const estrategiaBadge = versao
      ? `<span class="badge text-bg-primary ms-1" style="font-size:9px">${escaparHtml(versao.replace(/_v(\d+)$/, ' v$1').replace(/_/g, ' '))}</span>`
      : '';

    // 5: janela se disponível
    const janelaInfo = o.janela ? ` · ${o.janela}p` : '';

    // 6: alerta de reversão quando quintil da estratégia de entrada caiu para Q1/Q2
    const ultPonto = historicoInline?.pontos?.at(-1);
    const quintilAtual = versao && ultPonto?.quintilPorEstrategia?.[versao];
    const alertaReversao = historicoInline && quintilAtual != null && quintilAtual <= 2
      ? `<span class="badge text-bg-warning ms-1" title="Quintil atual Q${quintilAtual} — sinal reverteu">⚠ Q${quintilAtual} reverteu</span>`
      : '';

    // 11: P&L inline quando historico já foi carregado
    const pnlInline = historicoInline
      ? `<div class="d-flex align-items-center gap-2 mt-1">
           <span class="small ${classeValor(historicoInline.totalRetornoPct)}">
             ${escaparHtml(formatarPercentual(historicoInline.totalRetornoPct, 2, { sinal: true, vazio: SEM }))}
           </span>
           <span class="small ${classeValor(historicoInline.totalPnlRs)}">
             ${escaparHtml(formatarMoeda(historicoInline.totalPnlRs, SEM))}
           </span>
           ${sparklineSvg(historicoInline.pontos)}
         </div>`
      : '';

    const financeiro = status === 'PENDENTE' && !temDesempenho
      ? `<div class="small text-muted">Aguardando data de entrada para calcular P&amp;L.</div>`
      : status === 'PENDENTE' && temDesempenho
        ? `<div class="small text-muted">Data de entrada atingida — veja o desempenho.</div>${pnlInline}`
        : `<div>P&amp;L ${escaparHtml(formatarMoeda(pnl, SEM))}</div>
           <div>acumulado ${escaparHtml(formatarPercentual(acum, 2, { sinal: true, vazio: SEM }))}</div>${pnlInline}`;

    const botaoAcao = status === 'PENDENTE'
      ? `<button class="btn btn-sm btn-outline-danger mt-1" data-excluir-operacao="${o.id}">Excluir</button>`
      : status === 'ABERTA'
        ? `<button class="btn btn-sm btn-outline-warning mt-1" data-encerrar-operacao="${o.id}">Encerrar</button>`
        : '';

    const botaoPnl = temDesempenho
      ? `<button class="btn btn-sm btn-outline-info mt-1 ms-1" data-historico-operacao="${o.id}">Ver desempenho</button>`
      : '';

    // 14: atalho → Cenário pré-preenchido
    const botaoCenario = temDesempenho && o.simbolo && o.dataEntrada
      ? `<button type="button" class="btn btn-sm btn-outline-secondary mt-1 ms-1"
           data-simular-cenario="${o.id}"
           data-simbolo="${escaparHtml(o.simbolo)}"
           data-data-entrada="${escaparHtml(String(o.dataEntrada))}"
           data-capital="${escaparHtml(String(o.capital || '10000'))}"
           title="Usar esta entrada no Cenário">→ Cenário</button>`
      : '';

    // melhoria 6: thead com rótulos de coluna no histórico
    const thead = `<thead><tr>
      <th class="small fw-normal text-muted" style="white-space:nowrap">Data</th>
      <th class="small fw-normal text-muted text-end">P&amp;L dia</th>
      <th class="small fw-normal text-muted text-end">Acumulado</th>
    </tr></thead>`;

    const detalhe = diarios.length
      ? `<details class="mt-2"><summary class="small text-muted" style="cursor:pointer;">
           Histórico pregão a pregão (${diarios.length})
         </summary>
         <div class="table-responsive mt-1">
           <table class="table table-sm">
             ${thead}
             <tbody>${diarios.map((d) => `<tr>
               <td>${escaparHtml(formatarData(d.dataPregao))}</td>
               <td class="text-end">${escaparHtml(formatarMoeda(d.pnlRs ?? d.pnlDia, SEM))}</td>
               <td class="text-end">${escaparHtml(formatarPercentual(d.retornoAcumPct ?? d.pnlAcumulado, 2, { sinal: true, vazio: SEM }))}</td>
             </tr>`).join('')}</tbody>
           </table>
         </div></details>`
      : status !== 'PENDENTE'
        ? '<small class="text-muted d-block mt-2">O contrato atual ainda não publicou o acompanhamento pregão a pregão.</small>'
        : '';

    return `<article class="ficha-cartao mb-2">
      <div class="d-flex flex-wrap justify-content-between gap-2">
        <div>
          <strong>${escaparHtml(o.simbolo || SEM)}</strong>
          <span class="badge text-bg-secondary">${escaparHtml(status)}</span>${estrategiaBadge}${alertaReversao}
          <div class="small">entrada ${escaparHtml(formatarData(o.dataEntrada))} ${escaparHtml(diasDecorridos(o.dataEntrada))} · ${escaparHtml(formatarMoeda(o.capital, SEM))}${janelaInfo}</div>
          <div class="small text-muted">${resumoStatus}</div>
        </div>
        <div class="text-end">
          ${financeiro}
          ${botaoAcao}${botaoPnl}${botaoCenario}
        </div>
      </div>
      ${detalhe}
      <div id="historico-${o.id}" class="mt-2" style="display:none"></div>
    </article>`;
  }).join('');

  return form + filtros + itens;
}

export const htmlOperacoesManuais = htmlOperacoes;
