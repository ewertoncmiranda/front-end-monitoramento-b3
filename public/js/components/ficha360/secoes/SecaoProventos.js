import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarMoeda, formatarPercentual } from '../../../utils/numero.js';
import { formatarData } from '../../../utils/dataHora.js';
import '../../ficha/ProventosContabeis.js';

const n = (v) => v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v);
const campo = (obj, snake, camel) => obj?.[snake] ?? obj?.[camel] ?? null;
export function resumoProventos(proventos = [], fundamentos = {}, preco) {
  const hoje = new Date(); const limite = new Date(hoje); limite.setDate(limite.getDate() - 365);
  const recentes = proventos.filter((p) => {
    const fim = campo(p, 'dt_fim_exercicio', 'dtFimExercicio');
    return fim && new Date(`${fim}T00:00:00`) >= limite;
  });
  const porAcao12m = recentes.reduce((acc, p) => acc + (n(campo(p, 'por_acao', 'porAcao')) ?? 0), 0);
  const dy = n(preco) > 0 && recentes.length ? porAcao12m / Number(preco) : null;
  const anual = proventos.filter((p) => campo(p, 'tipo_doc', 'tipoDoc') === 'DFP').sort((a, b) => String(campo(b, 'dt_fim_exercicio', 'dtFimExercicio')).localeCompare(String(campo(a, 'dt_fim_exercicio', 'dtFimExercicio'))))[0];
  const total = n(anual?.total); const lucro = n(campo(fundamentos, 'lucro_liquido', 'lucroLiquido'));
  return { dy, payout: total !== null && lucro !== null && lucro !== 0 ? total / lucro : null, periodoPayout: campo(anual, 'dt_fim_exercicio', 'dtFimExercicio') || fundamentos.periodo || null };
}

export class SecaoProventos extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><p class="ficha-rotulo">Proventos</p><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [proventosRaw, fc] = await Promise.all([this._contexto.obter('proventos'), this._contexto.obter('fundamentosCvm')]);
    if (!this.isConnected) return;
    const proventos = Array.isArray(proventosRaw) ? proventosRaw : [];
    const r = resumoProventos(proventos, fc || {}, fc?.preco_referencia);
    this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Proventos</h2><div class="row g-2 mb-2"><div class="col-6"><div class="ficha-cartao"><span class="ficha-rotulo">Dividend yield (12 meses)</span><strong>${escaparHtml(r.dy === null ? '—' : formatarPercentual(r.dy))}</strong></div></div><div class="col-6"><div class="ficha-cartao"><span class="ficha-rotulo">Payout do último exercício</span><strong>${escaparHtml(r.payout === null ? '—' : formatarPercentual(r.payout))}</strong><small class="d-block">${escaparHtml(formatarData(r.periodoPayout))}</small></div></div></div><proventos-contabeis simbolo="${escaparHtml(this._contexto.simbolo)}"></proventos-contabeis></section>`;
  }
}
if (!customElements.get('secao-proventos')) customElements.define('secao-proventos', SecaoProventos);
