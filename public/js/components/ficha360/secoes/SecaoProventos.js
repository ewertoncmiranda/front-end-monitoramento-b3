import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarMoeda, formatarNumero, formatarPercentual } from '../../../utils/numero.js';
import { formatarData } from '../../../utils/dataHora.js';
import '../../ficha/ProventosContabeis.js';
import { eventosRecentes, normalizarDatasEx } from '../../../analise/ficha360/datasEx.js';

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

const ORIGEM = { DATA_EX_B3: 'tabela de datas ex da B3', COTAHIST_AO_VIVO: 'calculado ao vivo do histórico de cotações (COTAHIST)' };
const vazioDatasEx = '<div class="mt-3" data-datas-ex><h3 class="h6">Datas ex</h3><p class="small text-muted mb-0">Sem datas ex disponíveis para este ativo.</p></div>';

/** Bloco "Datas ex" (MICRO-PAI-3). Sem dado: estado vazio discreto. */
export function htmlDatasEx(dto, hoje = new Date()) {
  const d = normalizarDatasEx(dto);
  if (!d) return vazioDatasEx;
  const linhas = eventosRecentes(d.eventos, hoje).map((e) => {
    const pct = n(e.ajustePercentual);
    return `<tr><td>${escaparHtml(formatarData(e.dataEx))}</td><td><span class="badge text-bg-secondary">${escaparHtml(e.tipo || 'OUTRO')}</span></td><td class="text-end">${escaparHtml(formatarMoeda(e.ajusteImplicito))}${pct === null ? '' : ` (${escaparHtml(formatarNumero(pct))}%)`}</td><td class="text-end">${escaparHtml(formatarMoeda(e.valorDeclarado))}</td><td class="text-end">${escaparHtml(formatarPercentual(e.yieldDoEvento))}</td><td class="text-end">${escaparHtml(formatarNumero(e.razaoAjuste))}</td></tr>`;
  }).join('');
  const r = d.resumo;
  const proxima = r?.proximaDataEstimada
    ? `<p class="small mb-2" data-proxima-ex>Próxima data ex estimada: <strong>${escaparHtml(formatarData(r.proximaDataEstimada))}</strong>${r.proximoTipo ? ` (${escaparHtml(r.proximoTipo)})` : ''}${r.confianca ? ` — confiança ${escaparHtml(r.confianca)}` : ''}.${r.leitura ? ` ${escaparHtml(r.leitura)}` : ''}</p>`
    : (r?.leitura ? `<p class="small mb-2">${escaparHtml(r.leitura)}</p>` : '');
  const tabela = linhas
    ? `<div class="table-responsive"><table class="table table-sm small mb-1"><thead><tr><th>Data ex</th><th>Tipo</th><th class="text-end">Ajuste implícito</th><th class="text-end">Valor declarado</th><th class="text-end">Yield do evento</th><th class="text-end">Razão de ajuste</th></tr></thead><tbody>${linhas}</tbody></table></div>`
    : '<p class="small text-muted mb-1">Nenhuma data ex nos últimos 24 meses.</p>';
  const origem = ORIGEM[d.origemDados] || d.origemDados;
  return `<div class="mt-3" data-datas-ex><h3 class="h6">Datas ex</h3>${proxima}${tabela}<p class="small text-muted mb-0">O ajuste implícito é o fechamento anterior menos a abertura do dia ex; estimativas de data são apenas indicativas.${origem ? ` Origem dos dados: ${escaparHtml(origem)}.` : ''}</p></div>`;
}

export class SecaoProventos extends BaseComponent {
  set contexto(ctx) { this._contexto = ctx; this.carregar(); }
  template() { return '<section class="ficha-cartao"><p class="ficha-rotulo">Proventos</p><p class="small text-muted">Carregando…</p></section>'; }
  async connectedCallback() { super.connectedCallback(); if (this._contexto) await this.carregar(); }
  async carregar() {
    if (!this._contexto || !this.isConnected) return;
    const [proventosRaw, fc, datasEx] = await Promise.all([this._contexto.obter('proventos'), this._contexto.obter('fundamentosCvm'), this._contexto.obter('datasEx')]);
    if (!this.isConnected) return;
    const proventos = Array.isArray(proventosRaw) ? proventosRaw : [];
    const r = resumoProventos(proventos, fc || {}, fc?.preco_referencia);
    this.innerHTML = `<section class="ficha-cartao"><h2 class="h6">Proventos</h2><div class="row g-2 mb-2"><div class="col-6"><div class="ficha-cartao"><span class="ficha-rotulo">Dividend yield (12 meses)</span><strong>${escaparHtml(r.dy === null ? '—' : formatarPercentual(r.dy))}</strong></div></div><div class="col-6"><div class="ficha-cartao"><span class="ficha-rotulo">Payout do último exercício</span><strong>${escaparHtml(r.payout === null ? '—' : formatarPercentual(r.payout))}</strong><small class="d-block">${escaparHtml(formatarData(r.periodoPayout))}</small></div></div></div>${htmlDatasEx(datasEx)}<proventos-contabeis simbolo="${escaparHtml(this._contexto.simbolo)}"></proventos-contabeis></section>`;
  }
}
if (!customElements.get('secao-proventos')) customElements.define('secao-proventos', SecaoProventos);
