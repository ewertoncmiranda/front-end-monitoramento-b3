import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { modeloValuation, faixaMultiplo, formatarValor, formatarValorMonetario } from '../../../analise/ficha360/valuation.js';
import { modeloPremioRisco, grahamAjustadoPeloJuro, formatarPontos, formatarPercentual, formatarData } from '../../../analise/ficha360/premioRisco.js';
import '../../../components/ficha/ValorJustoRegua.js';

const htmlMetrica = (rotulo, valor, casas, tipo) => {
  const faixa = faixaMultiplo(valor, tipo);
  return `<div class="col-6 col-md-3"><div class="ficha-cartao h-100"><span class="ficha-rotulo">${rotulo}</span><strong class="d-block ${faixa.classe}">${formatarValor(valor, casas)}</strong><small class="${faixa.classe}">${faixa.rotulo}</small></div></div>`;
};

export function htmlPremioRisco(m) {
  if (!m.disponivel) {
    return `<p class="small text-body-secondary mt-2 mb-0" role="status" data-premio-aviso>Rendimento contra renda fixa: ${escaparHtml(m.motivo)}</p>`;
  }
  const selo = (s) => s ? `<span class="fw-semibold ${s.classe}" data-selo><span aria-hidden="true">${s.icone}</span> ${escaparHtml(s.texto)}</span>` : '';
  return `<div class="ficha-cartao mt-2" role="group" aria-labelledby="premio-titulo" data-premio>
    <h3 class="h6" id="premio-titulo">Rendimento contra renda fixa</h3>
    <div class="row g-2">
      <div class="col-6 col-md-3"><span class="ficha-rotulo">Earnings yield</span><strong class="d-block">${formatarPercentual(m.earningsYield)}</strong></div>
      <div class="col-6 col-md-3"><span class="ficha-rotulo">Juro real NTN-B</span><strong class="d-block">${formatarPercentual(m.juroReal)}</strong><small class="text-body-secondary">venc. ${formatarData(m.vencimento)} · base ${formatarData(m.dataBase)}</small></div>
      <div class="col-12 col-md-6"><span class="ficha-rotulo">Prêmio de risco</span><strong class="d-block">${formatarPontos(m.premio)}</strong>${selo(m.selo)}</div>
    </div>
    ${m.leitura ? `<p class="small mt-2 mb-1">${escaparHtml(m.leitura)}</p>` : ''}
    ${m.premioSobreSelic !== null ? `<p class="small mb-0" data-selic>Contra a Selic meta (${formatarPercentual(m.selicMeta)}): <strong>${formatarPontos(m.premioSobreSelic)}</strong> ${selo(m.seloSelic)}</p>` : ''}
  </div>`;
}

export class SecaoValuation extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><p class="ficha-rotulo">Valuation</p><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [fc, analise, premioDto] = await Promise.all([this._contexto.obter('fundamentosCvm'), this._contexto.obter('analise'), this._contexto.obter('premioRisco')]);
    if (!this.isConnected) return;
    const v = modeloValuation(fc || {});
    const pr = modeloPremioRisco(premioDto);
    const gAj = grahamAjustadoPeloJuro(v.graham, pr.selicMeta);
    const cartaoGraham = htmlMetrica('Graham Number (valor atual)', v.graham, 2, 'graham') + (gAj === null ? '' :
      `<div class="col-6 col-md-3"><div class="ficha-cartao h-100" data-graham-ajustado><span class="ficha-rotulo">Graham ajustado pelo juro</span><strong class="d-block">${formatarValor(gAj, 2)}</strong><small class="text-body-secondary">V × 4,4 / Y, Y = Selic meta ${formatarPercentual(pr.selicMeta)} (juro nominal no lugar do AAA)</small></div></div>`);
    this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Valuation</h2><div data-graham></div>
      <div class="row g-2">${cartaoGraham}${htmlMetrica('P/L atual', v.pl, 2, 'pl')}${htmlMetrica('P/L setorial (mediana)', v.plSetorial, 2, 'pl')}${htmlMetrica('EV / EBITDA', v.evEbitda, 2, 'ev_ebitda')}${htmlMetrica('P / VP', v.pvp, 2, 'pvp')}</div>
      ${htmlPremioRisco(pr)}
      <div class="ficha-cartao mt-2"><span class="ficha-rotulo">Preço implícito pelo P/L setorial</span><strong class="d-block">${escaparHtml(formatarValorMonetario(v.precoImplicitoSetorial))}</strong><small>Preço atual: ${escaparHtml(formatarValorMonetario(v.preco))}</small></div>
      <p class="small text-body-secondary mt-2 mb-0">Fonte: ${escaparHtml(v.fonte || '—')} · balanço ${escaparHtml(v.periodo || '—')} · ${v.defasagemDias ?? '—'} dias de defasagem.</p></section>`;
    const alvo = this.querySelector('[data-graham]');
    if (analise?.detalhes?.valuation) {
      const regua = document.createElement('valor-justo-regua'); alvo.append(regua);
      regua.setDados({ fundamentos: analise, preco: v.preco });
    }
  }
}
if (!customElements.get('secao-valuation')) customElements.define('secao-valuation', SecaoValuation);
