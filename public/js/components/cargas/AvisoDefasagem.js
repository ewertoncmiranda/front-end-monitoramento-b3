import { BaseComponent } from '../base/BaseComponent.js';
import { obterUltimasCargas } from '../../api/cargasApi.js';
import { etapasAtrasadas, rotuloEtapa } from '../../analise/cargas.js';
import { escaparHtml } from '../../utils/html.js';

export function htmlAvisoDefasagem(dados, agora) {
  const atrasadas = etapasAtrasadas(dados, agora);
  if (!atrasadas.length) return '';
  return `<div class="alert alert-warning small py-2" role="status"><strong>▲ Carga atrasada.</strong>
    ${atrasadas.map((item) => escaparHtml(rotuloEtapa(item.etapa))).join(', ')}.
    <a href="#/cargas" class="alert-link">Ver cargas de dados</a></div>`;
}

// Consulta independente: uma falha da saúde dos dados não esconde o atraso das cargas.
export class AvisoDefasagem extends BaseComponent {
  template() { return ''; }

  async afterRender() {
    this._controller?.abort();
    const controller = new AbortController();
    this._controller = controller;
    try {
      const dados = await obterUltimasCargas({ signal: controller.signal });
      if (this.isConnected && !controller.signal.aborted) this.innerHTML = htmlAvisoDefasagem(dados);
    } catch (erro) {
      if (this.isConnected && !controller.signal.aborted) {
        this.innerHTML = '<p class="small text-muted">Atualidade das cargas indisponível. <a href="#/cargas">Ver cargas de dados</a></p>';
      }
    }
  }

  disconnectedCallback() { this._controller?.abort(); }
}

customElements.define('aviso-defasagem-cargas', AvisoDefasagem);
