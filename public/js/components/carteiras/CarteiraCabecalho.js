// Cabecalho de uma carteira: nome, estrategia e resumo (custo, valor atual,
// resultado, melhor/pior, proventos). O resumo vem de carteira-posicoes (setResumo).
import { BaseComponent } from '../base/BaseComponent.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';
import { escaparHtml } from '../../utils/html.js';
import { infoResultado } from './CarteiraCardAtivo.js';

// Nome, estrategia e cor vem do gestor e sao compartilhados pela instancia:
// tudo escapado, e cor so entra no style se for #RGB/#RRGGBB.
const corSegura = (cor) => (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(cor)) ? cor : '#6c757d');

const kpi = (rotulo, valor, extra = '') => `<div class="col-6 col-md-3 col-lg-auto"><small class="text-body-secondary d-block">${rotulo}</small>${valor}${extra}</div>`;

/** HTML dos indicadores do resumo; campos sem dado ficam fora ou com "—", nunca 0. */
export function htmlResumo(r) {
  if (!r) return '<div class="placeholder-glow"><span class="placeholder col-6"></span></div>';
  const res = infoResultado(r.resultado, r.resultadoPct);
  const ext = (p) => (p ? `<div class="small ${infoResultado(p.resultadoPct, p.resultadoPct).classe}">${escaparHtml(p.simbolo)} ${infoResultado(p.resultadoPct, p.resultadoPct).sinal}${formatarPercentual(Math.abs(p.resultadoPct), 2)}</div>` : '');
  const partes = [
    kpi('Valor investido (custo)', `<strong data-kpi="investido">${formatarMoeda(r.investido)}</strong>`),
    kpi('Valor atual', `<strong data-kpi="valor-atual">${formatarMoeda(r.valorAtual)}</strong>`, r.dataUltimoPreco ? `<div class="small text-body-secondary">preço de ${formatarData(r.dataUltimoPreco)}</div>` : ''),
    kpi('Resultado', `<strong class="${res.classe}" data-kpi="resultado"><span aria-hidden="true">${res.seta}</span> ${res.texto} (${res.textoPct})</strong>`, `<div class="small ${res.classe}">${res.rotulo}</div>`),
    kpi('Melhor ativo', r.melhor ? `<strong>${escaparHtml(r.melhor.simbolo)}</strong>${ext(r.melhor)}` : '<strong>—</strong>'),
    kpi('Pior ativo', r.pior ? `<strong>${escaparHtml(r.pior.simbolo)}</strong>${ext(r.pior)}` : '<strong>—</strong>'),
    kpi('Ativos', `<strong data-kpi="ativos">${r.numeroAtivos}</strong>`, r.legados ? `<div class="small text-body-secondary">${r.legados} legado(s) (capital)</div>` : ''),
  ];
  if (r.proventosRecebidos !== null && r.proventosRecebidos !== undefined) {
    partes.push(kpi('Proventos recebidos', `<strong data-kpi="proventos-recebidos">${formatarMoeda(r.proventosRecebidos)}</strong>`, r.yieldOnCostRecebido !== null ? `<div class="small">yield on cost ${formatarPercentual(r.yieldOnCostRecebido, 2)}</div>` : ''));
    if (r.retornoTotal !== null) partes.push(kpi('Retorno total (com recebidos)', `<strong data-kpi="retorno-total">${formatarPercentual(r.retornoTotal, 2, { sinal: true })}</strong>`));
  }
  if (r.proventosEstimados !== null && r.proventosEstimados !== undefined) {
    partes.push(kpi('Proventos estimados <span class="badge text-bg-warning">estimado</span>', `<strong data-kpi="proventos-estimados">${formatarMoeda(r.proventosEstimados)}</strong>`, '<div class="small text-body-secondary">bruto, não recebido</div>'));
    if (r.retornoTotalComEstimados !== null) partes.push(kpi('Retorno total com estimados', `<strong>${formatarPercentual(r.retornoTotalComEstimados, 2, { sinal: true })}</strong>`));
  }
  const aviso = r.semPreco ? `<p class="small text-warning-emphasis mb-0 mt-2" role="note">${r.semPreco} ativo(s) sem cotação ficam fora do valor atual e do resultado.</p>` : '';
  return `<div class="row g-2 mt-1" aria-live="polite">${partes.join('')}</div>${aviso}`;
}

export class CarteiraCabecalho extends BaseComponent {
  #carteira = null;
  #resumo = null;

  template() {
    if (!this.#carteira) {
      return `<div class="card mb-3 placeholder-glow"><div class="card-body"><span class="placeholder col-6"></span></div></div>`;
    }
    const c = this.#carteira;
    return `<div class="card mb-3" style="border-left: 4px solid ${corSegura(c.cor)}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h2 class="h5 card-title mb-1">${escaparHtml(c.nome ?? '')}</h2>
            ${c.estrategia ? `<span class="badge bg-secondary mb-2">${escaparHtml(c.estrategia)}</span>` : ''}
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary js-editar">Editar</button>
            <button class="btn btn-sm btn-outline-danger js-remover">Remover</button>
          </div>
        </div>
        ${htmlResumo(this.#resumo)}
        <p class="small text-body-secondary mb-0 mt-2">Criada em ${formatarData(c.criadaEm)}</p>
      </div>
    </div>`;
  }

  afterRender() {
    this.querySelector('.js-editar')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('editar-carteira', { bubbles: true, detail: { carteira: this.#carteira } }));
    });
    this.querySelector('.js-remover')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('remover-carteira', { bubbles: true, detail: { carteira: this.#carteira } }));
    });
  }

  /** Recebe um objeto Carteira e re-renderiza o cabeçalho. */
  setCarteira(carteira) {
    this.#carteira = carteira;
    this.render();
  }

  /** Resumo calculado por carteira-posicoes (resumirCarteira). */
  setResumo(resumo) {
    this.#resumo = resumo;
    this.render();
  }
}

if (!customElements.get('carteira-cabecalho')) customElements.define('carteira-cabecalho', CarteiraCabecalho);
