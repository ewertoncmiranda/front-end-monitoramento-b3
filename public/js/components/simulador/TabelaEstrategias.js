import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';
import { formatarDataHora } from '../../utils/dataHora.js';

const SEM = '—';
const ESTRATEGIAS_PADRAO = ['MOMENTO_PURO', 'MOMENTO_REVERSAO', 'BAIXO_SPREAD', 'VALOR_RELATIVO', 'QUALIDADE', 'DIVIDENDOS', 'DEFENSIVA'];
const iaCache = new Map();

// 1: frescor do sinal baseado em dataPregao
function frescoTag(dataPregao) {
  if (!dataPregao) return '';
  const hoje = new Date().toISOString().slice(0, 10);
  const dias = Math.round((new Date(hoje) - new Date(String(dataPregao).slice(0, 10))) / 86_400_000);
  if (dias <= 0) return '<span class="badge text-bg-success ms-1" style="font-size:9px">hoje</span>';
  if (dias <= 3) return `<span class="badge text-bg-success ms-1" style="font-size:9px">${dias}d</span>`;
  if (dias <= 7) return `<span class="badge text-bg-warning ms-1" style="font-size:9px">${dias}d</span>`;
  return `<span class="badge text-bg-secondary ms-1" style="font-size:9px">${dias}d</span>`;
}

// 2: quintil como badge colorido (Q1=vermelho … Q5=verde)
function quintilBadge(q) {
  if (q == null) return `<span class="text-muted">${SEM}</span>`;
  const mapa = { 1: 'danger', 2: 'warning', 3: 'secondary', 4: 'success', 5: 'success' };
  const cor = mapa[q] || 'secondary';
  const extra = q === 4 ? ' opacity-75' : '';
  return `<span class="badge text-bg-${cor}${extra}">Q${q}</span>`;
}

// 5: score como barra visual proporcional
function scoreVisual(score) {
  if (score == null) return `<span class="text-muted">${SEM}</span>`;
  const pct = Math.min(100, Math.max(0, Math.round(Number(score) * 100)));
  const cor = pct >= 60 ? 'success' : pct >= 40 ? 'warning' : 'danger';
  return `<div style="min-width:60px">
    <div class="progress mb-0" style="height:5px;border-radius:2px">
      <div class="progress-bar bg-${cor}" style="width:${pct}%"></div>
    </div>
    <span style="font-size:10px" class="text-muted">${Number(score).toFixed(2)}</span>
  </div>`;
}

// 4: resumo consolidado dos ativos monitorados
export function resumoEstrategias(ativos, resultadosPorAtivo) {
  if (!ativos.length) return '';
  let q5 = 0, q4mais = 0;
  ativos.forEach((ativo) => {
    const simbolo = ativo?.simbolo || ativo?.ticker || '';
    const raw = resultadosPorAtivo[simbolo];
    const todos = Array.isArray(raw) ? raw : (raw?.resultados || raw?.itens || []);
    const quintis = todos.map((r) => r?.quintil).filter((q) => q != null);
    if (quintis.some((q) => q === 5)) q5++;
    if (quintis.some((q) => q >= 4)) q4mais++;
  });
  return `<div class="d-flex flex-wrap gap-3 small mb-3 px-3 py-2 rounded"
               style="background:var(--bs-secondary-bg,#f8f9fa)">
    <span class="text-muted">Monitorados: <strong>${ativos.length}</strong></span>
    <span class="text-success">Com Q5: <strong>${q5}</strong></span>
    <span class="text-primary">Com Q≥4: <strong>${q4mais}</strong></span>
  </div>`;
}

export function limparCacheIaLivre() {
  iaCache.clear();
}

export function payloadIaLivre(simbolo, dados) {
  const lista = Array.isArray(dados) ? dados : (dados?.resultados || dados?.itens || []);
  return {
    simbolo,
    resultados: ESTRATEGIAS_PADRAO.map((estrategia) => {
      const r = lista.find((item) => String(item?.estrategia || item?.versaoEstrategia || '').toUpperCase().startsWith(estrategia)) || {};
      return { estrategia, quintil: r.quintil ?? null, retorno: r.retorno ?? r.retornoPct ?? r.retornoPercentual ?? null };
    }),
  };
}

export async function obterIaLivre(simbolo, dados, analisarIa) {
  const chave = String(simbolo || '').toUpperCase();
  if (iaCache.has(chave)) return iaCache.get(chave);
  const resposta = await analisarIa(chave, payloadIaLivre(chave, dados));
  iaCache.set(chave, resposta || {});
  return resposta || {};
}

export function agruparResultados(resultados = []) {
  return resultados.reduce((grupos, item) => {
    const simbolo = item?.simbolo || 'SEM_ATIVO';
    (grupos[simbolo] ||= []).push(item);
    return grupos;
  }, {});
}

export function htmlTabelaEstrategias(resultados = [], analises = {}, carregandoIa = new Set()) {
  if (!Array.isArray(resultados) && resultados) resultados = resultados.itens || resultados.resultados || [];
  if (Array.isArray(resultados) && resultados.some((item) => item?.simbolo) && !resultados.some((item) => item?.versaoEstrategia || item?.retornoPct || item?.score)) {
    const ativos = resultados;
    const resultadosPorAtivo = analises || {};
    const iaPorAtivo = carregandoIa && !(carregandoIa instanceof Set) ? carregandoIa : {};
    const carregando = arguments[3];
    const achatados = ativos.flatMap((ativo) => {
      const simbolo = ativo?.simbolo || ativo?.ticker || '';
      const _raw = resultadosPorAtivo[simbolo];
      const todos = Array.isArray(_raw) ? _raw : (_raw?.resultados || _raw?.itens || []);
      const maisRecente = ESTRATEGIAS_PADRAO.map((prefixo) => {
        const candidatos = todos.filter((r) => String(r?.versaoEstrategia || '').toUpperCase().startsWith(prefixo));
        const melhor = candidatos.sort((a, b) => (b.dataPregao || '') > (a.dataPregao || '') ? 1 : -1)[0];
        return melhor || { versaoEstrategia: prefixo };
      });
      return maisRecente.map((r) => ({ simbolo, ...r }));
    });
    return htmlTabelaEstrategias(achatados, iaPorAtivo, new Set(carregando ? [carregando] : []));
  }
  const grupos = agruparResultados(resultados);
  if (!Object.keys(grupos).length) return '<p class="small text-muted">Ainda não há resultados de estratégias para os ativos monitorados.</p>';
  return Object.entries(grupos).map(([simbolo, itens]) => {
    const analise = analises[simbolo];
    // 2 + 5: quintil como badge e score como barra
    const linhas = itens.map((r) => `<tr>
      <td>${escaparHtml(r.versaoEstrategia || SEM)}${frescoTag(r.dataPregao)}</td>
      <td>${quintilBadge(r.quintil)}</td>
      <td>${escaparHtml(formatarPercentual(r.retornoPct, 2, { sinal: true, vazio: SEM }))}</td>
      <td>${scoreVisual(r.score)}</td>
    </tr>`).join('');
    const salvo = analise?.salvoEm ? formatarDataHora(analise.salvoEm) : '';
    return `<section class="ficha-cartao mb-3" data-estrategias="${escaparHtml(simbolo)}">
      <div class="d-flex justify-content-between align-items-center mb-2"><strong>${escaparHtml(simbolo)}</strong>
        <button class="btn btn-sm btn-outline-primary" type="button" data-analisar-ia="${escaparHtml(simbolo)}" ${carregandoIa.has(simbolo) ? 'disabled' : ''}>
          ${carregandoIa.has(simbolo) ? 'Analisando…' : 'IA_LIVRE (7+1)'}</button></div>
      <div class="table-responsive"><table class="table table-sm tabela-cartoes mb-0"><thead><tr><th>Estratégia</th><th>Quintil</th><th>Retorno</th><th>Score</th></tr></thead><tbody>${linhas}</tbody></table></div>
      ${analise ? `<div class="alert alert-secondary small mt-3 mb-0" data-analise-ia><p class="mb-1">${escaparHtml(analise.analiseTexto || analise.texto || analise.analise || analise.resumo || SEM)}</p><span class="text-muted">${analise.emCache ? 'cache reutilizado · ' : ''}salvo em ${escaparHtml(salvo || SEM)}</span></div>` : ''}
      <details class="mt-2">
        <summary class="small text-muted" style="cursor:pointer;list-style:none"
          data-carregar-diario="${escaparHtml(simbolo)}">▸ Histórico de sinais</summary>
        <div id="diario-sinais-${escaparHtml(simbolo)}" class="mt-1"></div>
      </details>
    </section>`;
  }).join('');
}
