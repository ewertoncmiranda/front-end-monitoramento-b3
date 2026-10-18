// Unica responsabilidade: o HTML dos cartoes flutuantes de ativos (um por
// acao) e dos tickers escolhidos. Puro, sem DOM: o <busca-ativos> liga os
// cliques pelos atributos data-ba-*.
import { escaparHtml } from '../../utils/html.js';
import { leituraDaRecomendacao, moeda, pontos } from '../../analise/fichaDoAtivo.js';
import { htmlSparkline } from '../../analise/listagemAtivos.js';
import { resumoOperacionalTicker } from '../../analise/operabilidade.js';

const ROTULO_ACAO = {
  consultar: 'Consultar',
};

function htmlVariacao(pontosPercentuais) {
  const v = pontosPercentuais === null || pontosPercentuais === undefined ? null : Number(pontosPercentuais);
  if (v === null || Number.isNaN(v)) return '<span class="ba-mudo">—</span>';
  const sobe = v >= 0;
  return `<span class="ba-var" style="color:${sobe ? 'var(--f360-compra, #16a34a)' : 'var(--f360-venda, #be123c)'}">${sobe ? '▲' : '▼'} ${pontos(v, 2, true)}</span>`;
}

function htmlSelosDoCartao(item) {
  const selos = [];
  if (item.sinal?.recomendacao) {
    const { rotulo, tom } = leituraDaRecomendacao(item.sinal.recomendacao);
    selos.push(`<span class="badge text-bg-${tom}">${escaparHtml(rotulo)}</span>`);
  }
  const op = resumoOperacionalTicker(item.operacional);
  if (op) selos.push(`<span class="badge ${op.statusClasse}">${escaparHtml(op.statusRotulo)}</span>`);
  return selos.join('');
}

/**
 * Um cartao por acao. `selecionados`: tickers ja escolhidos; `modo` muda o
 * texto do botao principal; `acoes`: botoes extras (ex.: ['consultar']).
 */
export function htmlCartaoAtivo(item, { selecionados = [], modo = 'unico', acoes = [] } = {}) {
  const simbolo = String(item.simbolo ?? '').toUpperCase();
  const s = escaparHtml(simbolo);
  const escolhido = selecionados.includes(simbolo);
  const rotuloPrincipal = escolhido
    ? (modo === 'multiplo' ? '✓ Adicionado' : '✓ Selecionado')
    : (modo === 'multiplo' ? '+ Adicionar' : 'Selecionar');
  const extras = acoes.filter((a) => ROTULO_ACAO[a]).map((a) =>
    `<button type="button" class="btn btn-sm btn-outline-secondary" data-ba-acao="${a}" data-ba-simbolo="${s}">${ROTULO_ACAO[a]}</button>`).join('');
  return `
    <article class="ba-cartao${escolhido ? ' ba-escolhido' : ''}" data-ba-cartao="${s}" aria-label="${s}">
      <div class="d-flex justify-content-between align-items-baseline gap-1">
        <strong class="ba-simbolo">${s}</strong>${htmlVariacao(item.variacaoPercentual)}
      </div>
      <div class="ba-nome text-truncate" title="${escaparHtml(item.nome ?? '')}">${escaparHtml(item.nome ?? '—')}</div>
      <div class="ba-mudo text-truncate">${escaparHtml(item.setor ?? 'Setor não informado')}</div>
      <div class="d-flex justify-content-between align-items-end gap-1 mt-1">
        <span class="ba-preco">${moeda(item.ultimoFechamento)}</span>${htmlSparkline(item.serieFechamentos, simbolo)}
      </div>
      <div class="d-flex flex-wrap gap-1 mt-1">${htmlSelosDoCartao(item)}</div>
      <div class="d-flex flex-wrap gap-1 mt-2">
        <button type="button" class="btn btn-sm ${escolhido ? 'btn-success' : 'btn-outline-primary'}" data-ba-escolher="${s}"
                aria-pressed="${escolhido}">${rotuloPrincipal}</button>
        ${extras}
        <a class="btn btn-sm btn-link px-1" href="#/ativo/${encodeURIComponent(simbolo)}">Ficha</a>
      </div>
    </article>`;
}

export function htmlCartoesAtivos(itens, opcoes = {}) {
  if (!itens?.length) return '';
  return `<div class="ba-cartoes">${itens.map((item) => htmlCartaoAtivo(item, opcoes)).join('')}</div>`;
}

/** Tickers escolhidos, flutuando acima dos resultados, cada um com "×". */
export function htmlTickersSelecionados(selecionados, { modo = 'unico', vazio = 'Nenhum ativo selecionado.' } = {}) {
  const titulo = modo === 'multiplo' ? 'Selecionados' : 'Selecionado';
  if (!selecionados?.length) {
    return `<div class="ba-tickers" data-ba-tickers><span class="ba-mudo">${escaparHtml(vazio)}</span></div>`;
  }
  return `<div class="ba-tickers" data-ba-tickers aria-label="${titulo}">
    ${selecionados.map((s) => `<span class="ba-ticker"><a href="#/ativo/${encodeURIComponent(s)}">${escaparHtml(s)}</a>
      <button type="button" class="ba-ticker-x" data-ba-remover="${escaparHtml(s)}" aria-label="Remover ${escaparHtml(s)}">×</button></span>`).join('')}
  </div>`;
}

export const ESTILO_BUSCA_ATIVOS = `
  busca-ativos { display: block; }
  .ba-tickers { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; min-height: 2rem; margin-bottom: .5rem; }
  .ba-ticker { display: inline-flex; align-items: center; gap: .3rem; padding: .2rem .35rem .2rem .65rem;
    border-radius: 999px; background: var(--f360-superficie, var(--bs-body-bg)); border: 1px solid var(--bs-border-color);
    box-shadow: 0 .25rem .6rem rgba(0, 0, 0, .12); font-weight: 600; font-size: .85rem; }
  .ba-ticker a { color: inherit; text-decoration: none; }
  .ba-ticker-x { border: 0; background: transparent; color: var(--bs-secondary-color); font-size: 1rem; line-height: 1;
    padding: 0 .2rem; border-radius: 50%; }
  .ba-ticker-x:hover { color: var(--f360-venda, #be123c); }
  .ba-cartoes { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: .6rem; }
  .ba-cartao { background: var(--f360-superficie, var(--bs-body-bg)); border: 1px solid var(--bs-border-color);
    border-radius: 12px; padding: .6rem .7rem; box-shadow: 0 .2rem .5rem rgba(0, 0, 0, .08);
    transition: transform .12s ease, box-shadow .12s ease; min-width: 0; }
  .ba-cartao:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1.2rem rgba(0, 0, 0, .16); }
  .ba-cartao.ba-escolhido { border-color: var(--f360-compra, #16a34a); box-shadow: 0 0 0 2px var(--f360-compra, #16a34a) inset, 0 .4rem 1rem rgba(0, 0, 0, .12); }
  .ba-simbolo { font-size: 1rem; letter-spacing: .02em; }
  .ba-nome { font-size: .82rem; font-weight: 500; }
  .ba-mudo { font-size: .75rem; color: var(--f360-texto-mudo, var(--bs-secondary-color)); }
  .ba-preco { font-weight: 600; font-variant-numeric: tabular-nums; }
  .ba-var { font-size: .8rem; font-weight: 600; white-space: nowrap; }
  .ba-cartao .ativo-sparkline { width: 72px; height: 22px; }
  @media (prefers-reduced-motion: reduce) { .ba-cartao, .ba-cartao:hover { transition: none; transform: none; } }
`;
