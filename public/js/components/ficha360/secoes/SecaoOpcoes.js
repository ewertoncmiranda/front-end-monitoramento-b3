import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarMoeda } from '../../../utils/numero.js';

export function resumoOpcoes(resposta) {
  const opcoes = Array.isArray(resposta?.opcoes) ? resposta.opcoes : [];
  const negociada = new Map();
  opcoes.forEach((o) => {
    const strike = o.preco_exercicio ?? o.precoExercicio;
    if (strike == null) return;
    const chave = String(strike);
    negociada.set(chave, (negociada.get(chave) || 0) + (Number(o.numero_negocios ?? o.numeroNegocios) || Number(o.volume) || 0));
  });
  const top = [...negociada.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    vencimentos: Array.isArray(resposta?.vencimentos) ? resposta.vencimentos : [],
    calls: opcoes.filter((o) => String(o.bdi) === '12' && Number(o.numero_negocios ?? o.numeroNegocios ?? 0) > 0).length,
    puts: opcoes.filter((o) => String(o.bdi) === '14' && Number(o.numero_negocios ?? o.numeroNegocios ?? 0) > 0).length,
    strikeMaisNegociado: top ? Number(top[0]) : null,
    status: resposta?.status || null,
    motivo: resposta?.motivo || null,
  };
}

export class SecaoOpcoes extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><p class="ficha-rotulo">Opções</p><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const r = resumoOpcoes(await this._contexto.obter('opcoes'));
    if (!this.isConnected) return;
    this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Opções</h2><dl class="row small"><dt class="col-7">Vencimentos</dt><dd class="col-5">${r.vencimentos.length ? escaparHtml(r.vencimentos.join(', ')) : '—'}</dd><dt class="col-7">CALL válidas</dt><dd class="col-5">${r.calls}</dd><dt class="col-7">PUT válidas</dt><dd class="col-5">${r.puts}</dd><dt class="col-7">Strike mais negociado</dt><dd class="col-5">${escaparHtml(formatarMoeda(r.strikeMaisNegociado))}</dd><dt class="col-7">Estado da cadeia</dt><dd class="col-5">${escaparHtml(r.status || '—')}</dd></dl><p class="small text-body-secondary">${escaparHtml(r.motivo || 'Sem cadeia válida disponível.')}</p><a href="#/opcoes/${encodeURIComponent(this._contexto.simbolo)}">Abrir cadeia de opções</a></section>`;
  }
}
if (!customElements.get('secao-opcoes')) customElements.define('secao-opcoes', SecaoOpcoes);
