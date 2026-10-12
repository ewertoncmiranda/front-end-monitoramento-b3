import { escaparHtml } from '../../utils/html.js';
import { formatarPercentual } from '../../utils/numero.js';
import { formatarDataHora } from '../../utils/dataHora.js';

const SEM = '—';
const ESTRATEGIAS_PADRAO = ['MOMENTO_PURO', 'MOMENTO_REVERSAO', 'BAIXO_SPREAD', 'VALOR_RELATIVO', 'QUALIDADE', 'DIVIDENDOS', 'DEFENSIVA'];
const iaCache = new Map();

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
      const dados = resultadosPorAtivo[simbolo]?.resultados || resultadosPorAtivo[simbolo]?.itens || [];
      const base = dados.length ? dados : ESTRATEGIAS_PADRAO.map((versaoEstrategia) => ({ versaoEstrategia }));
      return base.map((r) => ({ simbolo, ...r }));
    });
    return htmlTabelaEstrategias(achatados, iaPorAtivo, new Set(carregando ? [carregando] : []));
  }
  const grupos = agruparResultados(resultados);
  if (!Object.keys(grupos).length) return '<p class="small text-muted">Ainda não há resultados de estratégias para os ativos monitorados.</p>';
  return Object.entries(grupos).map(([simbolo, itens]) => {
    const analise = analises[simbolo];
    const linhas = itens.map((r) => `<tr>
      <td>${escaparHtml(r.versaoEstrategia || SEM)}</td>
      <td>${r.quintil ?? SEM}</td>
      <td>${escaparHtml(formatarPercentual(r.retornoPct, 2, { sinal: true, vazio: SEM }))}</td>
      <td>${r.score ?? SEM}</td>
    </tr>`).join('');
    const salvo = analise?.salvoEm ? formatarDataHora(analise.salvoEm) : '';
    return `<section class="ficha-cartao mb-3" data-estrategias="${escaparHtml(simbolo)}">
      <div class="d-flex justify-content-between align-items-center mb-2"><strong>${escaparHtml(simbolo)}</strong>
        <button class="btn btn-sm btn-outline-primary" type="button" data-analisar-ia="${escaparHtml(simbolo)}" ${carregandoIa.has(simbolo) ? 'disabled' : ''}>
          ${carregandoIa.has(simbolo) ? 'Analisando…' : 'IA_LIVRE (7+1)'}</button></div>
      <div class="table-responsive"><table class="table table-sm tabela-cartoes mb-0"><thead><tr><th>Estratégia</th><th>Quintil</th><th>Retorno</th><th>Score</th></tr></thead><tbody>${linhas}</tbody></table></div>
      ${analise ? `<div class="alert alert-secondary small mt-3 mb-0" data-analise-ia><p class="mb-1">${escaparHtml(analise.analiseTexto || analise.texto || analise.analise || analise.resumo || SEM)}</p><span class="text-muted">${analise.emCache ? 'cache reutilizado · ' : ''}salvo em ${escaparHtml(salvo || SEM)}</span></div>` : ''}
    </section>`;
  }).join('');
}
