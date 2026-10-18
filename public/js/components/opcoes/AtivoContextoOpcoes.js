import { BaseComponent } from '../base/BaseComponent.js';
import { dataBr, moeda, numero, pontos } from '../../analise/fichaDoAtivo.js';
import { badgeClassParaRecomendacao } from '../../utils/recomendacaoBadge.js';
import { escaparHtml } from '../../utils/html.js';

const MAX_EX_DIVIDENDOS = 3;

const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** Fracao (0,0123) -> "+1,23%" com seta e cor da paleta; null -> "—". */
function htmlVariacao(fracao, casas = 2) {
  const v = num(fracao);
  if (v === null) return '—';
  const sobe = v >= 0;
  const cor = sobe ? 'var(--f360-compra, #16a34a)' : 'var(--f360-venda, #be123c)';
  return `<span style="color:${cor}">${sobe ? '▲' : '▼'} ${pontos(v * 100, casas, true)}</span>`;
}

function htmlBarraRange(posicao) {
  const p = num(posicao);
  if (p === null) return '<span class="text-body-secondary">—</span>';
  const pct = Math.min(100, Math.max(0, Math.round(p * 100)));
  return `<div class="progress" style="height:6px" role="progressbar" aria-label="Posição no range de 63 pregões"
      aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar" style="width:${pct}%"></div>
    </div>
    <div class="d-flex justify-content-between opc-ctx-mudo"><span>mín</span><span>${pct}%</span><span>máx</span></div>`;
}

function htmlRecomendacao(recomendacao) {
  if (!recomendacao) return '—';
  return `<span class="badge ${badgeClassParaRecomendacao(recomendacao)}">${escaparHtml(String(recomendacao).replace(/_/g, ' '))}</span>`;
}

function htmlExDividendos(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return '—';
  const itens = lista.slice(0, MAX_EX_DIVIDENDOS).map((p) => {
    const valor = num(p.valor) > 0 ? ` · R$ ${numero(p.valor, 4)}` : '';
    return `<li>${escaparHtml(dataBr(p.data))} ${escaparHtml(p.tipo || '')}${escaparHtml(valor)}</li>`;
  }).join('');
  return `<ul class="list-unstyled mb-0">${itens}</ul>`;
}

function linha(rotulo, valorHtml) {
  return `<div class="opc-ctx-linha"><dt>${rotulo}</dt><dd>${valorHtml}</dd></div>`;
}

/** Os dois blocos da sidebar. Qualquer campo ausente vira "—", nunca zero. */
export function htmlContextoOpcoes(ctx) {
  const c = ctx || {};
  const precoAtual = num(c.precoAtual);
  const margem = num(c.margem);
  const vol21d = num(c.vol21d);
  const volRelativo = num(c.volRelativo);

  const bloco1 = [
    linha('Preço atual', precoAtual === null ? '—' : `<strong>${moeda(precoAtual)}</strong>`),
    linha('Variação do dia', htmlVariacao(c.variacaoDia)),
    linha('Máxima 63d', moeda(num(c.max63d))),
    linha('Mínima 63d', moeda(num(c.min63d))),
    `<div class="opc-ctx-range">${htmlBarraRange(c.posicaoRange)}</div>`,
    linha('Variação no período', htmlVariacao(c.variacaoPeriodo, 1)),
  ].join('');

  const bloco2 = [
    linha('Graham Number', moeda(num(c.graham))),
    linha('Recomendação', htmlRecomendacao(c.recomendacao)),
    linha('Margem de segurança', margem === null ? '—' : pontos(margem, 1)),
    linha('Volatilidade 21d', vol21d === null ? '—' : pontos(vol21d * 100, 1)),
    linha('ATR 14', moeda(num(c.atr14))),
    linha('Volume relativo', volRelativo === null ? '—' : `${numero(volRelativo, 2)}×`),
    linha('Ex-dividendos', htmlExDividendos(c.exDividendos)),
  ].join('');

  return `
    <section class="opc-ctx" aria-label="Contexto do ativo-objeto">
      <h2 class="opc-ctx-titulo">Preço e range</h2>
      <dl class="mb-3">${bloco1}</dl>
      <h2 class="opc-ctx-titulo">Valor e risco</h2>
      <dl class="mb-0">${bloco2}</dl>
    </section>`;
}

const ESTILO = `
  <style>
    .opc-ctx { background: var(--f360-superficie-2, var(--bs-tertiary-bg)); border: 1px solid var(--bs-border-color);
      border-radius: 12px; padding: .75rem .9rem; font-size: .85rem; }
    .opc-ctx-titulo { font-size: .72rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
      color: var(--f360-texto-mudo, var(--bs-secondary-color)); margin-bottom: .4rem; }
    .opc-ctx-linha { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; padding: .15rem 0; }
    .opc-ctx-linha dt { font-weight: 400; color: var(--f360-texto-mudo, var(--bs-secondary-color)); }
    .opc-ctx-linha dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
    .opc-ctx-range { padding: .35rem 0 .2rem; }
    .opc-ctx-mudo { font-size: .7rem; color: var(--f360-texto-mudo, var(--bs-secondary-color)); }
  </style>`;

// Unica responsabilidade: a sidebar de contexto do ativo-objeto na tela de
// opcoes. Recebe o contexto ja montado pela OpcaoPage (setContexto) e so
// desenha; nao busca nada.
export class AtivoContextoOpcoes extends BaseComponent {
  setContexto(contexto) {
    this._contexto = contexto ?? null;
    this.innerHTML = this.template();
  }

  template() {
    return ESTILO + htmlContextoOpcoes(this._contexto);
  }
}

customElements.define('ativo-contexto-opcoes', AtivoContextoOpcoes);
