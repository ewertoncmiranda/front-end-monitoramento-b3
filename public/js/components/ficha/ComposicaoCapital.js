import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarNumero } from '../../utils/numero.js';

// Unica responsabilidade: composicao acionaria ON x PN (REQ-ETL-4) em rosca SVG, com legenda,
// fonte e competencia. Dado de GET /ativos/{simbolo}/composicao-capital. Sem dado = sem render.
export class ComposicaoCapital extends BaseComponent {
  setDados(dados) {
    this._dados = dados;
    this.innerHTML = dados ? renderizar(dados) : '';
  }
}

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const lerCampo = (d, snake, camel) => num(d[snake] ?? d[camel]);

/** ON, PN, tesouraria e total do DTO (aceita snake_case e camelCase); zero e valido, ausente e null. */
export function normalizarComposicao(d) {
  const on = lerCampo(d, 'qt_acao_ordinaria', 'qtAcaoOrdinaria');
  const pn = lerCampo(d, 'qt_acao_preferencial', 'qtAcaoPreferencial');
  const tesouraria = lerCampo(d, 'qt_acao_ex_tesouraria', 'qtAcaoExTesouraria');
  const total = lerCampo(d, 'qt_acao_total', 'qtAcaoTotal') ?? ((on ?? 0) + (pn ?? 0));
  return { on, pn, tesouraria, total };
}

function fatias(on, pn) {
  const base = (on ?? 0) + (pn ?? 0);
  if (base <= 0) return [];
  return [
    { rotulo: 'ON', qt: on ?? 0, pct: ((on ?? 0) / base) * 100, cor: 'var(--bs-primary, #0d6efd)' },
    { rotulo: 'PN', qt: pn ?? 0, pct: ((pn ?? 0) / base) * 100, cor: 'var(--bs-info, #0dcaf0)' },
  ];
}

function rosca(lista) {
  const raio = 40;
  const circ = 2 * Math.PI * raio;
  let acumulado = 0;
  const arcos = lista.filter((f) => f.pct > 0).map((f) => {
    const comp = (f.pct / 100) * circ;
    const arco = `<circle cx="60" cy="60" r="${raio}" fill="none" stroke="${f.cor}" stroke-width="18"
      stroke-dasharray="${comp.toFixed(2)} ${(circ - comp).toFixed(2)}" stroke-dashoffset="${(-acumulado).toFixed(2)}"
      transform="rotate(-90 60 60)"><title>${f.rotulo}: ${f.pct.toFixed(1).replace('.', ',')}%</title></circle>`;
    acumulado += comp;
    return arco;
  }).join('');
  const resumo = lista.map((f) => `${f.rotulo} ${f.pct.toFixed(1).replace('.', ',')}%`).join(', ');
  return `<svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Composição acionária: ${escaparHtml(resumo)}">${arcos}</svg>`;
}

function competencia(d) {
  const data = d.dt_refer ?? d.dtRefer;
  if (!data) return '';
  const [ano, mes] = String(data).split('-');
  return mes ? `${mes}/${ano}` : escaparHtml(String(data));
}

const qtde = (n) => (n === null ? '—' : escaparHtml(formatarNumero(n, 0)));

/** Cartao completo (puro: devolve HTML). */
export function renderizar(d) {
  const { on, pn, tesouraria, total } = normalizarComposicao(d || {});
  const lista = fatias(on, pn);
  if (!lista.length) return '';
  const emCirculacao = tesouraria; // qt_acao_ex_tesouraria ja e o total sem as acoes em tesouraria
  const tipo = d.tipo_doc ?? d.tipoDoc;
  const fonte = `Fonte: CVM${tipo ? ` (${escaparHtml(tipo)})` : ''}`;
  const comp = competencia(d);
  const legenda = lista.map((f) => `<li data-fatia="${f.rotulo}"><span class="badge" style="background:${f.cor}">${f.rotulo}</span>
      ${qtde(f.qt)} <span class="text-muted">(${f.pct.toFixed(1).replace('.', ',')}%)</span></li>`).join('');
  const semPn = (pn ?? 0) === 0 ? '<p class="small text-muted mb-1">Sem ações preferenciais (PN = 0).</p>' : '';
  return `<section class="ficha-cartao" data-composicao-capital>
    <p class="ficha-rotulo">Composição acionária ON × PN</p>
    <div class="d-flex flex-wrap align-items-center gap-3">
      ${rosca(lista)}
      <div>
        <ul class="list-unstyled small mb-1">${legenda}</ul>
        ${semPn}
        <p class="small mb-0">Total emitidas: <strong>${qtde(total)}</strong> · Em circulação (ex-tesouraria): <strong>${qtde(emCirculacao)}</strong></p>
      </div>
    </div>
    <p class="small text-muted mt-2 mb-0">${fonte}${comp ? ` · competência ${comp}` : ''}</p>
  </section>`;
}

customElements.define('composicao-capital', ComposicaoCapital);
