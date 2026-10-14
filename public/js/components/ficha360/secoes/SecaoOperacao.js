import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import '../../ficha/OperabilidadeAtivo.js';

export function htmlOperacao(simbolo) {
  const s = escaparHtml(simbolo);
  return `
    <operabilidade-ativo simbolo="${s}"></operabilidade-ativo>
    <div class="d-flex justify-content-end gap-2 mt-2">
      <a class="btn btn-sm btn-outline-primary" href="#/simulador" data-simular="${s}">Simular ${s} ›</a>
      <a class="btn btn-sm btn-link" href="#/operabilidade">Carteira de paper trading ›</a>
    </div>`;
}

// Unica responsabilidade: a secao Operacao da ficha - reaproveita o
// <operabilidade-ativo> (tese, timeline, operacoes simuladas do ativo) e leva
// ao simulador. Nao busca nada alem do que o componente reaproveitado busca.
export class SecaoOperacao extends BaseComponent {
  set contexto(ctx) {
    this._contexto = ctx;
    if (this.isConnected) this.innerHTML = this.template();
  }

  get contexto() {
    return this._contexto;
  }

  template() {
    return this._contexto ? htmlOperacao(this._contexto.simbolo) : '';
  }
}

customElements.define('secao-operacao', SecaoOperacao);
