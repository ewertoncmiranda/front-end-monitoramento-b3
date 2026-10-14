import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarMoeda, formatarNumero, formatarPercentual } from '../../../utils/numero.js';
import { METRICAS_FUNDAMENTOS, itemAtual } from '../../../analise/ficha360/seriesFundamentos.js';
import '../Sparkline.js';

function fmt(valor, formato) {
  if (valor === null) return '—';
  if (formato === 'pct') return formatarPercentual(valor / 100, 2);
  if (formato === 'moeda') return formatarMoeda(valor);
  return formatarNumero(valor, 2);
}

export class SecaoFundamentos extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><p class="ficha-rotulo">Fundamentos</p><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [fc, hist] = await Promise.all([this._contexto.obter('fundamentosCvm'), this._contexto.obter('fundamentosHistorico')]);
    if (!this.isConnected) return;
    const fundamentos = fc || {}; const pontos = hist?.pontos || [];
    this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Fundamentos</h2>${METRICAS_FUNDAMENTOS.map((g) => `<section class="mb-3"><h3 class="h6">${g.grupo}</h3><div class="row g-2">${g.itens.map(([key, label, formato]) => {
      const atual = itemAtual(fundamentos, pontos, key);
      const historicoPresente = pontos.length > 0;
      return `<div class="col-12 col-md-6"><div class="ficha-cartao h-100"><span class="ficha-rotulo">${label}</span><div class="d-flex align-items-center justify-content-between gap-2"><strong>${escaparHtml(fmt(atual.valor, formato))}</strong><span aria-label="Tendência ${atual.direcao.direcao}">${atual.direcao.simbolo}</span><f360-sparkline data-metrica="${key}"></f360-sparkline></div>${historicoPresente ? '' : '<small class="text-body-secondary">histórico indisponível</small>'}</div></div>`;
    }).join('')}</div></section>`).join('')}<p class="small text-body-secondary mb-0">Período do balanço: ${escaparHtml(fundamentos.periodo || '—')} · fonte: ${escaparHtml(fundamentos.fonte || '—')}.</p></section>`;
    this.querySelectorAll('f360-sparkline').forEach((el) => {
      const k = el.dataset.metrica; const serie = itemAtual(fundamentos, pontos, k).serie;
      el.valores = serie.map((p) => p.valor); el.rotulos = serie.map((p) => p.periodo); el.formato = k;
    });
  }
}
if (!customElements.get('secao-fundamentos')) customElements.define('secao-fundamentos', SecaoFundamentos);
