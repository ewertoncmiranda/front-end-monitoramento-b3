import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { modeloValuation, faixaMultiplo, formatarValor, formatarValorMonetario } from '../../../analise/ficha360/valuation.js';
import '../../../components/ficha/ValorJustoRegua.js';

const htmlMetrica = (rotulo, valor, casas, tipo) => {
  const faixa = faixaMultiplo(valor, tipo);
  return `<div class="col-6 col-md-3"><div class="ficha-cartao h-100"><span class="ficha-rotulo">${rotulo}</span><strong class="d-block ${faixa.classe}">${formatarValor(valor, casas)}</strong><small class="${faixa.classe}">${faixa.rotulo}</small></div></div>`;
};

export class SecaoValuation extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><p class="ficha-rotulo">Valuation</p><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [fc, analise] = await Promise.all([this._contexto.obter('fundamentosCvm'), this._contexto.obter('analise')]);
    if (!this.isConnected) return;
    const v = modeloValuation(fc || {});
    this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Valuation</h2><div data-graham></div>
      <div class="row g-2">${htmlMetrica('Graham Number', v.graham, 2, 'graham')}${htmlMetrica('P/L atual', v.pl, 2, 'pl')}${htmlMetrica('P/L setorial (mediana)', v.plSetorial, 2, 'pl')}${htmlMetrica('EV / EBITDA', v.evEbitda, 2, 'ev_ebitda')}${htmlMetrica('P / VP', v.pvp, 2, 'pvp')}</div>
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
