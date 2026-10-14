import { BaseComponent } from '../../base/BaseComponent.js';
import { escaparHtml } from '../../../utils/html.js';
import '../../ficha/AtivoIa.js';

export function htmlIa(simbolo) {
  return `<ativo-ia simbolo="${escaparHtml(simbolo)}"></ativo-ia>`;
}

// Unica responsabilidade: a secao IA da ficha - reaproveita o <ativo-ia>
// (leitura narrativa e chat com o contexto do ativo).
export class SecaoIa extends BaseComponent {
  set contexto(ctx) {
    this._contexto = ctx;
    if (this.isConnected) this.innerHTML = this.template();
  }

  get contexto() {
    return this._contexto;
  }

  template() {
    return this._contexto ? htmlIa(this._contexto.simbolo) : '';
  }
}

customElements.define('secao-ia', SecaoIa);
