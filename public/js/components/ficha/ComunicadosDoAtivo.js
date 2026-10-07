import { BaseComponent } from '../base/BaseComponent.js';
import { buscarComunicadosDoAtivo } from '../../api/comunicadosApi.js';
import { renderComunicado } from '../ComunicadoItem.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';
import { escaparHtml } from '../../utils/html.js';
import '../LoadingSpinner.js';

const TAMANHO = 10;

// Unica responsabilidade: ultimos comunicados oficiais (CVM/IPE) do ativo na
// aba Comunicados da ficha (REQ-UX-9), com link para a linha do tempo completa.
// Associacao por data de entrega: nao prova causalidade.
export class ComunicadosDoAtivo extends BaseComponent {
  template() {
    return '<div data-corpo><loading-spinner></loading-spinner></div>';
  }

  async afterRender() {
    const simbolo = this.getAttribute('simbolo');
    const corpo = this.querySelector('[data-corpo]');
    if (!simbolo) return;
    try {
      const resposta = await buscarComunicadosDoAtivo(simbolo, { pagina: 0, tamanho: TAMANHO });
      if (this.getAttribute('simbolo') !== simbolo) return;
      corpo.innerHTML = renderizar(simbolo, resposta);
    } catch (erro) {
      corpo.innerHTML = htmlEstadoVazio({
        titulo: 'Comunicados indisponíveis',
        causa: erro.message,
        acaoHref: `#/comunicados?simbolo=${encodeURIComponent(simbolo)}`,
        acaoRotulo: 'Abrir na tela de comunicados',
      });
    }
  }
}

export function renderizar(simbolo, resposta) {
  const lista = (resposta && resposta.comunicados) || [];
  const link = `#/comunicados?simbolo=${encodeURIComponent(simbolo)}`;
  if (!lista.length) {
    return htmlEstadoVazio({
      titulo: 'Sem comunicados',
      causa: 'Nenhum documento nas categorias padrão. Ativo sem balanço carregado não tem CNPJ ligado aos comunicados.',
      acaoHref: link,
      acaoRotulo: 'Ver todas as categorias',
    });
  }
  return `
    <ul class="list-group list-group-flush">${lista.map((c) => renderComunicado(c)).join('')}</ul>
    <div class="d-flex justify-content-between flex-wrap gap-2 mt-2">
      <a class="small" href="${escaparHtml(link)}">Ver a linha do tempo completa</a>
      <span class="small text-muted">${escaparHtml(resposta.fonte || 'CVM (IPE)')} · data de entrega, não prova causa do preço.</span>
    </div>`;
}

customElements.define('comunicados-do-ativo', ComunicadosDoAtivo);
