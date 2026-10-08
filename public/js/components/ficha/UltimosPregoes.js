import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarMoeda, formatarNumero } from '../../utils/numero.js';
import { ticketMedioDaSerie, ticketMedioDaVela } from '../../analise/pregoes.js';

const LINHAS = 10;
const DICA = 'Ticket médio = volume financeiro ÷ número de negócios do pregão (quanto cada negócio movimenta, em média). '
  + '"≈" indica estimativa por quantidade × fechamento, usada enquanto o volume financeiro não vem do banco. '
  + '"—" = sem negócios ou sem dado, não zero.';

// Unica responsabilidade: ultimos pregoes do banco (COTAHIST) com numero de negocios e
// ticket medio (REQ-ETL-2) no resumo da ficha. As velas ja foram buscadas pela ConsultaPage.
export class UltimosPregoes extends BaseComponent {
  template() {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Últimos pregões e ticket médio</p><div data-corpo class="small text-muted">Carregando…</div></section>';
  }

  setVelas(velas) {
    this._velas = velas || [];
    const corpo = this.querySelector('[data-corpo]');
    if (corpo) corpo.innerHTML = renderizar(this._velas);
  }
}

function celulaTicket(vela) {
  const t = ticketMedioDaVela(vela);
  if (t === null) return '—';
  return `${t.estimado ? '≈ ' : ''}${formatarMoeda(t.valor)}`;
}

/** Linha de resumo + sparkline do ticket medio diario + tabela dos ultimos pregoes (puro: devolve HTML). */
export function renderizar(velas) {
  const lista = (velas || []).filter((v) => v && v.dataIso);
  if (!lista.length) return 'Sem pregões no banco para este ativo.';
  const ordenadas = [...lista].sort((a, b) => (a.dataIso < b.dataIso ? -1 : 1));
  const recentes = ordenadas.slice(-LINHAS).reverse();
  const serie = ticketMedioDaSerie(ordenadas);
  const resumo = serie
    ? `<p class="mb-2">Ticket médio no período: <strong>${serie.estimado ? '≈ ' : ''}${escaparHtml(formatarMoeda(serie.valor))}</strong>
         <span class="text-muted" title="${escaparHtml(DICA)}">ⓘ</span> ${sparkline(ordenadas)}</p>`
    : `<p class="mb-2 text-muted">Ticket médio indisponível neste período (sem número de negócios). <span title="${escaparHtml(DICA)}">ⓘ</span></p>`;
  return `${resumo}
    <div class="table-responsive tabela-rolavel"><table class="table table-sm align-middle small mb-0 tabela-cartoes">
      <thead><tr><th>Data</th><th class="text-end">Fechamento</th><th class="text-end">Negócios</th>
        <th class="text-end">Volume</th><th class="text-end" title="${escaparHtml(DICA)}">Ticket médio ⓘ</th></tr></thead>
      <tbody>${recentes.map((v) => `<tr>
        <td data-label="Data">${escaparHtml(v.dataFormatada || v.dataIso)}</td>
        <td data-label="Fechamento" class="text-end">${escaparHtml(formatarMoeda(v.close))}</td>
        <td data-label="Negócios" class="text-end">${v.numeroNegocios > 0 ? escaparHtml(formatarNumero(v.numeroNegocios, 0)) : '—'}</td>
        <td data-label="Volume" class="text-end">${v.volume > 0 ? escaparHtml(formatarNumero(v.volume, 0)) : '—'}</td>
        <td data-label="Ticket médio" class="text-end">${escaparHtml(celulaTicket(v))}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

/** Linha do ticket medio diario; dias sem ticket calculavel ficam de fora (nunca zero). */
function sparkline(velas) {
  const pontos = velas.map((v) => ticketMedioDaVela(v)?.valor ?? null).filter((v) => v !== null);
  if (pontos.length < 2) return '';
  const largura = 120;
  const altura = 24;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const faixa = max - min || 1;
  const coords = pontos.map((p, i) => `${((i / (pontos.length - 1)) * largura).toFixed(1)},${(altura - ((p - min) / faixa) * (altura - 4) - 2).toFixed(1)}`);
  return `<svg class="ms-2 align-middle" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img"
    aria-label="Ticket médio diário no período, de ${escaparHtml(formatarMoeda(min))} a ${escaparHtml(formatarMoeda(max))}">
    <polyline fill="none" stroke="currentColor" stroke-width="1.5" points="${coords.join(' ')}"/></svg>`;
}

customElements.define('ultimos-pregoes', UltimosPregoes);
