import { BaseComponent } from '../base/BaseComponent.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { buscarFatores } from '../../api/lacunasApi.js';
import { barraDePercentil } from '../../analise/lacunas.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';
import { agruparFatores, formatarPercentilFator, leituraDoPercentil } from '../../analise/lacunas.js';

const CLASSE_LEITURA = {
  FAVORAVEL: 'text-bg-success',
  DESFAVORAVEL: 'text-bg-warning',
  NEUTRO: 'text-bg-light border',
};

// Unica responsabilidade: cartao "Fatores" da ficha (LAC-FE-2) - percentil de
// cada fator no universo e no setor, por familia, com a data do calculo.
// Dados de /ativos/{s}/fatores (LAC-GES-2). Descreve a posicao do ativo; nao e
// recomendacao (regra experimental).
export class FatoresAtivo extends BaseComponent {
  template() {
    return '<section class="ficha-cartao"><p class="ficha-rotulo">Fatores</p><div data-corpo class="small text-muted">Carregando…</div></section>';
  }

  async afterRender() {
    const simbolo = this.getAttribute('simbolo');
    const corpo = this.querySelector('[data-corpo]');
    if (!simbolo) return;
    try {
      const fatores = await buscarFatores(simbolo);
      if (this.getAttribute('simbolo') !== simbolo) return;
      corpo.innerHTML = renderizar(fatores);
    } catch {
      corpo.innerHTML = htmlEstadoVazio({ titulo: 'Fatores indisponíveis', causa: 'O cálculo mensal ainda não rodou, ou o gestor/banco ainda não tem o Plano LAC (V16).', acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados' });
    }
  }
}

export function renderizar(fatores) {
  const grupos = agruparFatores(fatores);
  if (!grupos.length) {
    return htmlEstadoVazio({ titulo: 'Sem dado ainda', causa: 'O cálculo mensal de fatores ainda não gravou este ativo.', acaoHref: '#/avaliacao', acaoRotulo: 'Ver saúde dos dados' });
  }
  const datas = (fatores || []).map((f) => f.dataReferencia).filter(Boolean).sort();
  const ultima = datas.length ? datas[datas.length - 1] : null;
  return `
    ${grupos.map((g) => `
      <h6 class="mt-2 mb-1">${escaparHtml(g.rotulo)}</h6>
      <div class="table-responsive"><table class="table table-sm align-middle small mb-0 tabela-cartoes">
        <thead><tr><th>Fator</th><th class="text-end">Valor</th><th class="text-end">No universo</th><th style="min-width:6rem">Posição</th><th class="text-end">No setor</th></tr></thead>
        <tbody>${g.fatores.map((f) => linha(f)).join('')}</tbody>
      </table></div>`).join('')}
    <p class="small text-muted mt-2 mb-0">Calculado em ${escaparHtml(formatarData(ultima, 'data não informada'))}.
      Percentil mostra a posição do ativo entre os demais, não uma previsão; a regra segue <strong>experimental</strong>.</p>`;
}

function linha(f) {
  const leitura = leituraDoPercentil(f.percentilUniverso, f.direcaoEsperada);
  const valor = f.valor === null || f.valor === undefined ? '—' : Number(f.valor).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  return `<tr>
    <td data-label="Fator" title="${escaparHtml(f.descricao || '')}">${escaparHtml(f.descricao || f.codigo)}</td>
    <td data-label="Valor" class="text-end">${valor}</td>
    <td data-label="No universo" class="text-end"><span class="badge ${CLASSE_LEITURA[leitura] || 'text-bg-light border'}">${formatarPercentilFator(f.percentilUniverso)}</span></td>
    <td data-label="Posição">${barraDePercentil(f.percentilUniverso, leitura)}</td>
    <td data-label="No setor" class="text-end">${formatarPercentilFator(f.percentilSetor)}${f.grupoSetor ? ` <span class="text-muted">(${escaparHtml(f.grupoSetor)})</span>` : ''}</td>
  </tr>`;
}

customElements.define('fatores-ativo', FatoresAtivo);
