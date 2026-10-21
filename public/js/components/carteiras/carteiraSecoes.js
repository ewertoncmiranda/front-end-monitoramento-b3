// CARTEIRAS-CARDS — HTML puro das secoes da carteira: barra de ferramentas,
// alocacao, evolucao (SVG acessivel) e estados vazios.
import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { CRITERIOS_ORDEM, LIMITE_CONCENTRACAO } from '../../analise/carteiraPosicao.js';
import { PERIODOS } from '../../analise/carteiraEvolucao.js';
import { PROXY_IBOV } from '../../api/carteirasDadosApi.js';

export const CHAVE_PREFS = 'b3-carteiras-prefs';

/** Preferencias (visao e ordenacao) no localStorage, sempre com try/catch. */
export function lerPrefs(storage = globalThis.localStorage) {
  const padrao = { visao: 'cards', ordem: 'maior-posicao', alocacao: 'ativo', periodo: 'entrada' };
  try {
    const p = JSON.parse(storage?.getItem(CHAVE_PREFS) || 'null') || {};
    return {
      visao: ['cards', 'tabela'].includes(p.visao) ? p.visao : padrao.visao,
      ordem: CRITERIOS_ORDEM.some((c) => c.valor === p.ordem) ? p.ordem : padrao.ordem,
      alocacao: ['ativo', 'setor'].includes(p.alocacao) ? p.alocacao : padrao.alocacao,
      periodo: PERIODOS.some((x) => x.valor === p.periodo) ? p.periodo : padrao.periodo,
    };
  } catch {
    return padrao;
  }
}

export function salvarPrefs(prefs, storage = globalThis.localStorage) {
  try {
    storage?.setItem(CHAVE_PREFS, JSON.stringify(prefs));
  } catch {
    // sem armazenamento: a escolha vale so ate recarregar
  }
}

export function htmlBarraFerramentas(prefs, filtro = '') {
  const opcoes = CRITERIOS_ORDEM.map((c) => `<option value="${c.valor}"${c.valor === prefs.ordem ? ' selected' : ''}>${c.rotulo}</option>`).join('');
  const btn = (v, rot) => `<button type="button" class="btn btn-sm ${prefs.visao === v ? 'btn-primary' : 'btn-outline-primary'}" data-visao="${v}" aria-pressed="${prefs.visao === v}">${rot}</button>`;
  return `<div class="carteira-toolbar d-flex flex-wrap gap-2 align-items-end mb-3">
    <div><label class="form-label small mb-0" for="filtro-texto">Filtrar</label>
      <input type="search" id="filtro-texto" class="form-control form-control-sm" placeholder="Ticker ou setor" value="${escaparHtml(filtro)}"></div>
    <div><label class="form-label small mb-0" for="ordem-posicoes">Ordenar por</label>
      <select id="ordem-posicoes" class="form-select form-select-sm">${opcoes}</select></div>
    <div class="btn-group" role="group" aria-label="Alternar visão">${btn('cards', 'Cards')}${btn('tabela', 'Tabela')}</div>
  </div>`;
}

export function htmlVazio() {
  return `<div class="text-center py-4 border rounded mb-3" data-vazio>
    <p class="h6 mb-1">Esta carteira ainda não tem ações.</p>
    <p class="small text-body-secondary mb-3">Informe o ticker e a quantidade: o preço do dia entra sozinho.</p>
    <button type="button" class="btn btn-success btn-sm" data-acao="foco-adicionar">Adicionar ações</button></div>`;
}

export function htmlGradeSkeleton(n = 3) {
  return `<div class="carteira-grade" aria-busy="true" aria-label="Carregando ativos">${Array.from({ length: n }, () => `<div class="card carteira-card"><div class="card-body placeholder-glow">
    <span class="placeholder col-4 mb-2"></span><span class="placeholder col-12 mb-2"></span><span class="placeholder col-8"></span></div></div>`).join('')}</div>`;
}

/** Alocacao: barras horizontais com % em texto; aviso quando passa do limite. */
export function htmlAlocacao(grupos, por = 'ativo', limite = LIMITE_CONCENTRACAO) {
  if (!grupos.length) return '';
  const btn = (v, rot) => `<button type="button" class="btn btn-sm ${por === v ? 'btn-primary' : 'btn-outline-primary'}" data-alocacao="${v}" aria-pressed="${por === v}">${rot}</button>`;
  const linhas = grupos.map((g) => `<li class="mb-1">
    <div class="d-flex justify-content-between small"><span>${escaparHtml(g.rotulo)}${g.concentrado ? ' <span class="badge text-bg-warning">concentração alta</span>' : ''}</span>
      <span>${formatarPercentual(g.fracao, 1)} · ${formatarMoeda(g.valor)}</span></div>
    <div class="progress" style="height:8px" role="img" aria-label="${escaparHtml(g.rotulo)}: ${formatarPercentual(g.fracao, 1)} da carteira"><div class="progress-bar ${g.concentrado ? 'bg-warning' : ''}" style="width:${(g.fracao * 100).toFixed(1)}%"></div></div></li>`).join('');
  const alertas = grupos.filter((g) => g.concentrado).map((g) => `${escaparHtml(g.rotulo)} (${formatarPercentual(g.fracao, 0)})`);
  return `<section class="card card-body mb-3" aria-labelledby="titulo-alocacao">
    <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2"><h2 class="h6 mb-0" id="titulo-alocacao">Alocação</h2>
      <div class="btn-group" role="group" aria-label="Agrupar alocação">${btn('ativo', 'Por ativo')}${btn('setor', 'Por setor')}</div></div>
    <ul class="list-unstyled mb-0">${linhas}</ul>
    ${alertas.length ? `<p class="small text-warning-emphasis mt-2 mb-0" role="note">Atenção: ${alertas.join(', ')} passa(m) de ${formatarPercentual(limite, 0)} da carteira.</p>` : ''}
  </section>`;
}

const LINHAS = [
  { chave: 'carteira', rotulo: 'Carteira', cor: 'var(--bs-primary)' },
  { chave: 'cdi', rotulo: 'CDI', cor: 'var(--bs-success)' },
  { chave: 'ibov', rotulo: `${PROXY_IBOV} (proxy do Ibovespa)`, cor: 'var(--bs-warning)' },
];

const pp = (v) => (v === null || v === undefined ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2).replace('.', ',')} p.p.`);

/**
 * Secao Evolucao. `estado`: { carregando, erro, avisos[], evolucao, periodo }.
 * Grafico SVG inline com texto alternativo e tabela recolhida.
 */
export function htmlEvolucao(estado) {
  const botoes = PERIODOS.map((p) => `<button type="button" class="btn btn-sm ${estado.periodo === p.valor ? 'btn-primary' : 'btn-outline-primary'}" data-periodo="${p.valor}" aria-pressed="${estado.periodo === p.valor}">${p.rotulo}</button>`).join('');
  const cab = `<div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2"><h2 class="h6 mb-0" id="titulo-evolucao">Evolução (base 100)</h2><div class="btn-group" role="group" aria-label="Período">${botoes}</div></div>`;
  const aviso = '<p class="small text-body-secondary mb-0 mt-2">Preços de fechamento da B3 sem ajuste de proventos; mede o desempenho dos preços, não é recomendação.</p>';
  let corpo;
  if (estado.carregando) corpo = '<p class="text-body-secondary mb-0" aria-busy="true">Carregando evolução…</p>';
  else if (estado.erro) corpo = `<p class="text-danger mb-0" role="alert">${escaparHtml(estado.erro)}</p>`;
  else if (!estado.evolucao?.suficiente) corpo = '<p class="text-body-secondary mb-0">Sem dados suficientes para a evolução: é preciso ao menos dois pregões com cotação desde a primeira compra.</p>';
  else corpo = htmlGrafico(estado.evolucao);
  const avisos = (estado.avisos || []).map((a) => `<p class="small text-warning-emphasis mb-1" role="note">${escaparHtml(a)}</p>`).join('');
  return `<section class="card card-body mb-3" aria-labelledby="titulo-evolucao">${cab}${avisos}${corpo}${aviso}</section>`;
}

function htmlGrafico(e) {
  const series = LINHAS.map((l) => ({ ...l, pontos: e[l.chave] || [] })).filter((l) => l.pontos.length);
  const datas = e.carteira.map((p) => p.dataIso);
  const todos = series.flatMap((s) => s.pontos.map((p) => p.valor));
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const W = 600; const H = 200; const M = { l: 44, r: 8, t: 8, b: 20 };
  const x = (i) => M.l + (i * (W - M.l - M.r)) / Math.max(1, datas.length - 1);
  const y = (v) => M.t + (1 - (v - min) / (max - min || 1)) * (H - M.t - M.b);
  const idx = new Map(datas.map((d, i) => [d, i]));
  const linhas = series.map((s) => `<polyline fill="none" stroke="${s.cor}" stroke-width="2" vector-effect="non-scaling-stroke" points="${s.pontos.map((p) => `${x(idx.get(p.dataIso)).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ')}"/>`).join('');
  const ret = (k) => (e.retornos[k] === null || e.retornos[k] === undefined ? null : e.retornos[k]);
  const legenda = series.map((s) => `<li><span class="evo-chave" style="background:${s.cor}"></span>${escaparHtml(s.rotulo)}: <strong>${formatarPercentual(ret(s.chave), 2, { sinal: true })}</strong></li>`).join('');
  const alt = `Evolução base 100 de ${formatarData(datas[0])} a ${formatarData(datas[datas.length - 1])}. ${series.map((s) => `${s.rotulo} ${formatarPercentual(ret(s.chave), 2, { sinal: true })}`).join('; ')}.`;
  const passo = Math.max(1, Math.ceil(datas.length / 30));
  const linhasTab = datas.map((d, i) => [d, i]).filter(([, i]) => i % passo === 0 || i === datas.length - 1).map(([d, i]) => `<tr><td>${formatarData(d)}</td>${series.map((s) => { const p = s.pontos.find((q) => q.dataIso === d); return `<td class="text-end">${p ? p.valor.toFixed(2).replace('.', ',') : '—'}</td>`; }).join('')}</tr>`).join('');
  return `<svg class="evo-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escaparHtml(alt)}">
    <line x1="${M.l}" x2="${W - M.r}" y1="${y(100).toFixed(1)}" y2="${y(100).toFixed(1)}" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 3"/>
    <text x="2" y="${M.t + 8}" font-size="10" fill="currentColor">${max.toFixed(1)}</text><text x="2" y="${H - M.b}" font-size="10" fill="currentColor">${min.toFixed(1)}</text>
    <text x="${M.l}" y="${H - 4}" font-size="10" fill="currentColor">${formatarData(datas[0])}</text><text x="${W - M.r}" y="${H - 4}" font-size="10" text-anchor="end" fill="currentColor">${formatarData(datas[datas.length - 1])}</text>${linhas}</svg>
    <ul class="list-inline small mb-1 evo-legenda">${legenda}</ul>
    ${e.diferencaCdiPp === null ? '' : `<p class="mb-1" data-evo="diferenca">Carteira contra o CDI: <strong>${pp(e.diferencaCdiPp)}</strong> no período.</p>`}
    <details class="small"><summary>Ver dados em tabela</summary><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>Data</th>${series.map((s) => `<th class="text-end">${escaparHtml(s.rotulo)}</th>`).join('')}</tr></thead><tbody>${linhasTab}</tbody></table></div></details>`;
}

/** Painel de venda inline (abre abaixo da barra de ferramentas). */
export function htmlPainelVenda(v) {
  if (!v) return '';
  return `<div class="card card-body mb-3 border-warning" data-painel-venda role="group" aria-label="Vender ${escaparHtml(v.simbolo)}">
    <h2 class="h6">Vender ${escaparHtml(v.simbolo)} <span class="text-body-secondary fw-normal small">(posição: ${v.posicao})</span></h2>
    <div id="msg-venda" role="alert"></div>
    <div class="row g-2 align-items-end">
      <div class="col-6 col-md-3"><label class="form-label small mb-0" for="venda-qtd">Quantidade</label><input class="form-control form-control-sm" id="venda-qtd" type="number" min="1" max="${v.posicao}" step="1"></div>
      <div class="col-6 col-md-3"><label class="form-label small mb-0" for="venda-preco">Preço (R$)</label><input class="form-control form-control-sm" id="venda-preco" type="number" min="0.01" step="0.01" value="${v.preco ?? ''}"></div>
      <div class="col-12 col-md-3 small" aria-live="polite">Total estimado: <strong id="venda-total">—</strong><br><span class="text-body-secondary">${v.dataPreco ? `fechamento de ${formatarData(v.dataPreco)}` : 'sem cotação: informe o preço'}</span></div>
      <div class="col-12 col-md-3 d-flex gap-2"><button type="button" class="btn btn-warning btn-sm" data-acao="confirmar-venda">Registrar venda</button><button type="button" class="btn btn-outline-secondary btn-sm" data-acao="cancelar-venda">Cancelar</button></div>
    </div><p class="small text-body-secondary mb-0 mt-2">Registro informado, não ordem executada.</p></div>`;
}
