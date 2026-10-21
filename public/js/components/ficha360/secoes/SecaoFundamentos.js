import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarMoeda, formatarNumero, formatarPercentual } from '../../../utils/numero.js';
import { METRICAS_FUNDAMENTOS, itemAtual } from '../../../analise/ficha360/seriesFundamentos.js';
import { htmlSparkline } from '../Sparkline.js';
import '../Sparkline.js';
import { modeloBanco } from '../../../analise/ficha360/banco.js';

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
  htmlPainelBanco(b) {
    const estilo = '<style>secao-fundamentos .f360-sparkline{width:100%;max-width:10rem;height:2rem;overflow:visible}secao-fundamentos .f360-sparkline polyline{fill:none;stroke:var(--bs-primary);stroke-width:2;vector-effect:non-scaling-stroke}</style>';
    const cartoes = b.indicadores.map((i) => `<div class="col-12 col-sm-6 col-lg-4"><div class="ficha-cartao h-100"><span class="ficha-rotulo">${i.rotulo}</span><div class="d-flex align-items-center justify-content-between gap-2 flex-wrap"><strong>${escaparHtml(fmt(i.valor, 'pct'))}</strong>${htmlSparkline(i.serie.map((p) => p.valor), i.serie.map((p) => p.periodo), i.rotulo)}</div></div></div>`).join('');
    const pvp = `<div class="col-12 col-sm-6 col-lg-4"><div class="ficha-cartao h-100"><span class="ficha-rotulo">P/VP</span><strong>${escaparHtml(fmt(b.pvp, 'numero'))}</strong>${b.pvp === null && b.pvpMotivo ? `<small class="d-block text-body-secondary">${escaparHtml(b.pvpMotivo)}</small>` : ''}</div></div>`;
    const roePvp = `<div class="col-12 col-sm-6 col-lg-4"><div class="ficha-cartao h-100"><span class="ficha-rotulo">ROE / P/VP</span><strong>${escaparHtml(fmt(b.roeSobrePvp, 'numero'))}</strong><small class="d-block text-body-secondary">maior = mais retorno por unidade paga</small></div></div>`;
    const selos = b.selos.length ? `<ul class="list-unstyled mb-2">${b.selos.map((s) => `<li class="mb-1"><span class="${s.visual.classe} fw-semibold"><span aria-hidden="true">${s.visual.icone}</span> ${escaparHtml(s.nome)}: ${s.visual.texto}</span>${s.leitura ? ` <span class="small text-body-secondary">${escaparHtml(s.leitura)}</span>` : ''}</li>`).join('')}</ul>` : '';
    return `${estilo}<section class="mb-3" aria-label="Indicadores de banco"><h3 class="h6">Banco · último trimestre ${escaparHtml(b.trimestre)}</h3><div class="row g-2 mb-2">${cartoes}${pvp}${roePvp}</div>${selos}${b.leitura ? `<p class="small mb-1">${escaparHtml(b.leitura)}</p>` : ''}${b.motivo ? `<p class="small text-body-secondary mb-1">${escaparHtml(b.motivo)}</p>` : ''}<p class="small text-body-secondary">Bancos são avaliados por P/VP × ROE e Basileia, não por EBITDA ou dívida (fonte: IF.data/BCB).</p></section>`;
  }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [fc, hist, bancoDto] = await Promise.all([this._contexto.obter('fundamentosCvm'), this._contexto.obter('fundamentosHistorico'), this._contexto.obter('banco')]);
    if (!this.isConnected) return;
    const fundamentos = fc || {}; const pontos = hist?.pontos || [];
    const banco = modeloBanco(bancoDto);
    const grupos = METRICAS_FUNDAMENTOS.map((g) => `<section class="mb-3"><h3 class="h6">${g.grupo}</h3><div class="row g-2">${g.itens.map(([key, label, formato]) => {
      const atual = itemAtual(fundamentos, pontos, key);
      const historicoPresente = pontos.length > 0;
      return `<div class="col-12 col-md-6"><div class="ficha-cartao h-100"><span class="ficha-rotulo">${label}</span><div class="d-flex align-items-center justify-content-between gap-2"><strong>${escaparHtml(fmt(atual.valor, formato))}</strong><span aria-label="Tendência ${atual.direcao.direcao}">${atual.direcao.simbolo}</span><f360-sparkline data-metrica="${key}"></f360-sparkline></div>${historicoPresente ? '' : '<small class="text-body-secondary">histórico indisponível</small>'}</div></div>`;
    }).join('')}</div></section>`).join('');
    const rodape = `<p class="small text-body-secondary mb-0">Período do balanço: ${escaparHtml(fundamentos.periodo || '—')} · fonte: ${escaparHtml(fundamentos.fonte || '—')}.</p>`;
    if (banco.estado === 'nao-banco') {
      this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Fundamentos</h2>${grupos}${rodape}</section>`;
    } else {
      const aviso = banco.estado === 'sem-dados' ? `<p class="small text-body-secondary" role="status">${escaparHtml(banco.motivo)}</p>` : '';
      const painel = banco.estado === 'banco' ? this.htmlPainelBanco(banco) : '';
      this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Fundamentos</h2>${painel}${aviso}<details class="mb-3"><summary class="small">Outros indicadores (muitos não se aplicam a bancos)</summary><div class="mt-2">${grupos}</div></details>${rodape}</section>`;
    }
    this.querySelectorAll('f360-sparkline[data-metrica]').forEach((el) => {
      const k = el.dataset.metrica; const serie = itemAtual(fundamentos, pontos, k).serie;
      el.valores = serie.map((p) => p.valor); el.rotulos = serie.map((p) => p.periodo); el.formato = k;
    });
  }
}
if (!customElements.get('secao-fundamentos')) customElements.define('secao-fundamentos', SecaoFundamentos);
