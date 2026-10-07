import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { buscarProventosContabeis } from '../../api/lacunasApi.js';
import { svgProventos } from '../../analise/graficoProventos.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';
import { formatarMoedaCompacta, rotuloOrigem, totalDoProvento } from '../../analise/lacunas.js';

// Unica responsabilidade: proventos por periodo contabil (LAC-FE-3), da DVA da
// CVM, marcando a origem de cada valor. Por periodo (ano/trimestre), nao por
// data de pagamento - complementa os eventos com data-com da B3.
// Dados de /ativos/{s}/proventos-contabeis (LAC-GES-3). Valor ausente aparece
// como "—", nunca como zero.
export class ProventosContabeis extends BaseComponent {
  template() {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Proventos por período contábil</p><div data-corpo class="small text-muted">Carregando…</div></section>';
  }

  async afterRender() {
    const simbolo = this.getAttribute('simbolo');
    const corpo = this.querySelector('[data-corpo]');
    if (!simbolo) return;
    try {
      const proventos = await buscarProventosContabeis(simbolo);
      if (this.getAttribute('simbolo') !== simbolo) return;
      corpo.innerHTML = renderizar(proventos);
    } catch {
      corpo.innerHTML = htmlEstadoVazio({ titulo: 'Proventos contábeis indisponíveis', causa: 'A DVA ainda não foi carregada, ou o gestor/banco ainda não tem o Plano LAC (V16).', acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados' });
    }
  }
}

export function renderizar(proventos) {
  if (!proventos || !proventos.length) {
    return htmlEstadoVazio({ titulo: 'Sem dado ainda', causa: 'Nenhum provento contábil (DVA) carregado para esta empresa.' });
  }
  return `
    ${svgProventos(proventos)}
    <div class="table-responsive tabela-rolavel"><table class="table table-sm align-middle small mb-0 tabela-cartoes">
      <thead><tr><th>Período</th><th>Doc.</th><th class="text-end">JCP</th><th class="text-end">Dividendos</th>
        <th class="text-end">Total</th><th class="text-end">Por ação</th><th>Origem</th></tr></thead>
      <tbody>${proventos.map((p) => `<tr>
        <td data-label="Período">${escaparHtml(formatarData(p.dtInicioExercicio))} a ${escaparHtml(formatarData(p.dtFimExercicio))}
          <div class="text-muted">entregue em ${escaparHtml(formatarData(p.dataEntrega))}</div></td>
        <td data-label="Doc.">${escaparHtml(p.tipoDoc || '—')}</td>
        <td data-label="JCP" class="text-end">${formatarMoedaCompacta(p.jcp)}</td>
        <td data-label="Dividendos" class="text-end">${formatarMoedaCompacta(p.dividendos)}</td>
        <td data-label="Total" class="text-end fw-semibold">${formatarMoedaCompacta(totalDoProvento(p))}</td>
        <td data-label="Por ação" class="text-end">${p.porAcao === null || p.porAcao === undefined ? '—' : `R$ ${Number(p.porAcao).toFixed(4).replace('.', ',')}`}</td>
        <td data-label="Origem"><span class="badge text-bg-light border">${escaparHtml(rotuloOrigem(p.origem))}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>
    <p class="small text-muted mt-2 mb-0">Valores em reais, declarados na DVA da CVM por período; "—" é dado ausente, não zero.</p>`;
}

customElements.define('proventos-contabeis', ProventosContabeis);
