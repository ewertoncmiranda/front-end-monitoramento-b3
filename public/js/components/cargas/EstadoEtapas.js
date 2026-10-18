import { BaseComponent } from '../base/BaseComponent.js';
import { ETAPAS, listaCargas, statusCarga, formatarDataCarga, defasagemEtapa, escaparHtml } from '../../analise/cargas.js';

export class EstadoEtapas extends BaseComponent {
  setDados(dados) {
    this.dados = listaCargas(dados);
    this.render();
  }

  template() {
    const cartoes = ETAPAS.map(etapa => {
      const dado = this.dados?.find(e => e.etapa === etapa.codigo) || {};
      const status = statusCarga(dado.ultimoStatus);
      const atraso = defasagemEtapa(etapa.codigo, dado.ultimoSucessoEm);
      const id = dado.execucaoId || dado.ultimaTentativaExecucaoId;
      const titulo = `${escaparHtml(etapa.nome)} · ${etapa.codigo}`;
      return `<div class="col-12 col-md-6 col-xl-4"><article class="card h-100 ${atraso.atrasada ? 'border-warning' : ''}"><div class="card-body">
        <h3 class="h6">${id ? `<a href="#/cargas/${encodeURIComponent(id)}">${titulo}</a>` : titulo}</h3>
        <p class="small text-muted">Fonte: ${escaparHtml(etapa.fonte)}</p>
        <p>Última tentativa: ${escaparHtml(formatarDataCarga(dado.ultimaTentativaEm))} <span class="badge text-bg-${status.classe}">${status.icone} ${status.rotulo}</span></p>
        <p>Último sucesso: ${escaparHtml(formatarDataCarga(dado.ultimoSucessoEm))}${atraso.dias !== null ? ` · há ${atraso.dias} dias` : ''}</p>
        ${atraso.atrasada ? '<p class="text-warning-emphasis">▲ Carga atrasada</p>' : ''}
      </div></article></div>`;
    }).join('');
    return `<section aria-label="Estado por etapa"><h2 class="h5">Estado por etapa</h2><div class="row g-3">${cartoes}</div></section>`;
  }
}
customElements.define('estado-etapas', EstadoEtapas);
