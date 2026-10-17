// CART-PAI-5 — Cabecalho de uma carteira: patrimônio ponderado, retorno médio e CDI estimado.
import { BaseComponent } from '../base/BaseComponent.js';
import { formatarMoeda, formatarPercentual } from '../../utils/numero.js';
import { formatarData } from '../../utils/dataHora.js';

// CDI anual aproximado usado para comparação (10,75% a.a.)
const CDI_AA = 0.1075;
const CDI_DIA = Math.pow(1 + CDI_AA, 1 / 252) - 1;

/** Calcula CDI acumulado estimado desde a data de referência até hoje. */
export function calcularCdiAcumulado(dataReferencia) {
  const inicio = new Date(dataReferencia);
  const hoje = new Date();
  const diasCorridos = Math.max(0, (hoje - inicio) / (1000 * 60 * 60 * 24));
  const diasUteis = diasCorridos * (252 / 365);
  return Math.pow(1 + CDI_DIA, diasUteis) - 1;
}

/** Calcula patrimônio ponderado: Σ capital × (1 + retorno). */
export function calcularPatrimonio(ativos) {
  return ativos.reduce((acc, a) => {
    const retorno = a.retorno ?? 0;
    return acc + a.capital * (1 + retorno);
  }, 0);
}

/** Calcula retorno médio ponderado: Σ (capital × retorno) / Σ capital. */
export function calcularRetornoMedioPonderado(ativos) {
  const totalCapital = ativos.reduce((acc, a) => acc + a.capital, 0);
  if (totalCapital === 0) return 0;
  const somaPonderada = ativos.reduce((acc, a) => {
    const retorno = a.retorno ?? 0;
    return acc + a.capital * retorno;
  }, 0);
  return somaPonderada / totalCapital;
}

export class CarteiraCabecalho extends BaseComponent {
  #carteira = null;

  template() {
    if (!this.#carteira) {
      return `<div class="card mb-3 placeholder-glow">
        <div class="card-body">
          <span class="placeholder col-6"></span>
        </div>
      </div>`;
    }

    const c = this.#carteira;
    const ativos = c.ativos ?? [];

    const patrimonio = calcularPatrimonio(ativos);
    const retornoMedio = calcularRetornoMedioPonderado(ativos);

    // Data mais antiga de entrada nos ativos, ou criadaEm como fallback
    const dataBase = ativos.length > 0
      ? ativos.reduce((min, a) => {
          const d = new Date(a.dataEntrada);
          return d < min ? d : min;
        }, new Date(ativos[0].dataEntrada))
      : new Date(c.criadaEm);

    const cdiAcumulado = calcularCdiAcumulado(dataBase);

    const sinalRetorno = retornoMedio >= 0 ? '+' : '';

    return `<div class="card mb-3" style="border-left: 4px solid ${c.cor}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="card-title mb-1">${c.nome}</h5>
            <span class="badge bg-secondary mb-2">${c.estrategia}</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary js-editar">Editar</button>
            <button class="btn btn-sm btn-outline-danger js-remover">Remover</button>
          </div>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-auto">
            <small class="text-muted d-block">Patrimônio</small>
            <strong>${formatarMoeda(patrimonio)}</strong>
          </div>
          <div class="col-auto">
            <small class="text-muted d-block">Retorno médio</small>
            <strong>${sinalRetorno}${formatarPercentual(retornoMedio, 2)}</strong>
          </div>
          <div class="col-auto">
            <small class="text-muted d-block">vs CDI est.</small>
            <strong>${formatarPercentual(cdiAcumulado, 2)}</strong>
          </div>
          <div class="col-auto">
            <small class="text-muted d-block">Criada em</small>
            <span>${formatarData(c.criadaEm)}</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  afterRender() {
    const btnEditar = this.querySelector('.js-editar');
    const btnRemover = this.querySelector('.js-remover');
    if (btnEditar) {
      btnEditar.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('editar-carteira', { bubbles: true, detail: { carteira: this.#carteira } }));
      });
    }
    if (btnRemover) {
      btnRemover.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('remover-carteira', { bubbles: true, detail: { carteira: this.#carteira } }));
      });
    }
  }

  /** Recebe um objeto Carteira e re-renderiza o cabeçalho. */
  setCarteira(carteira) {
    this.#carteira = carteira;
    this.render();
  }
}

customElements.define('carteira-cabecalho', CarteiraCabecalho);
