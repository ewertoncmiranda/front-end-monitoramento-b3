import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { escaparHtml } from '../../../utils/html.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';
import '../RankingTickers.js';
import { htmlAjuda } from '../../../utils/ajuda.js';
import { normalizarSetor, explicacaoSelo, explicacaoSetor } from '../../../analise/panoramaMercado.js';
import {
  textoSelo,
  escalaBarras,
  estadoVazioBloco,
  setoresOrdenados,
  formatarDesvio,
  formatarVariacaoSetor,
} from '../../../analise/panoramaMercado.js';

// Unica responsabilidade: card "Setores x Empresas" do carrossel de mercado
// (MERC-PAI-2). Lista setores ordenados por variacao mediana; barra divergente
// em torno de zero; selo de coesao; chips do melhor e pior desvio. Clique
// expande o setor e mostra <ranking-tickers> com melhores/piores. Apenas um
// setor fica expandido por vez. "Outros" sempre por ultimo, sem chips.

function htmlItemSetor(setor, idx, escala) {
  const v = setor.variacaoMediana;
  const pct = escala > 0 && v != null ? Math.round(Math.abs(v) / escala * 50) : 0;
  const barLeft = v >= 0 ? '50%' : `${50 - pct}%`;
  const corBarra = v >= 0 ? 'var(--f360-compra)' : 'var(--f360-venda)';
  const corTexto = v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-muted';
  const ehOutros = setor.nome === 'Outros';
  const melhor = !ehOutros ? (setor.melhores?.[0] ?? null) : null;
  const pior = !ehOutros ? (setor.piores?.[0] ?? null) : null;
  const liquidos = setor.quantidade;

  return `<li class="border-bottom py-2">
    <button type="button"
      class="d-flex align-items-center flex-wrap gap-2 w-100 btn btn-link p-0 text-start text-decoration-none text-body"
      data-expandir-setor="${idx}"
      aria-expanded="false"
      aria-controls="setor-${idx}-ranking">
      <span class="fw-semibold small" style="min-width:12rem;flex:1 1 16rem">${escaparHtml(setor.nome)}</span>
      <span class="flex-grow-1 position-relative d-block"
        aria-hidden="true"
        style="height:.4rem;background:var(--f360-superficie-2);border-radius:.25rem;overflow:hidden">
        <span class="position-absolute h-100 d-block"
          style="left:${barLeft};width:${pct}%;background:${corBarra};border-radius:.25rem"></span>
      </span>
      <span class="small ${corTexto} font-monospace" style="min-width:4.5rem;text-align:right">${v == null ? 'Sem dado' : escaparHtml(formatarVariacaoSetor(v))}</span>
      ${liquidos !== null && liquidos !== undefined ? `<span class="small text-muted" style="min-width:4rem">${escaparHtml(liquidos)} ações</span>` : ''}
      <span class="badge text-bg-secondary">${escaparHtml(textoSelo(setor.selo))}</span>
      ${melhor ? `<span class="badge text-bg-success" title="${escaparHtml(`Destaque: ${melhor.nome || melhor.simbolo}`)}">${escaparHtml(melhor.simbolo)}</span>` : ''}
      ${pior ? `<span class="badge text-bg-danger" title="${escaparHtml(`Ficou para trás: ${pior.nome || pior.simbolo}`)}">${escaparHtml(pior.simbolo)}</span>` : ''}
      <span class="small text-muted">Ver comparação ▾</span>
    </button>
    <div class="d-flex gap-3 flex-wrap mt-1 small text-muted justify-content-end">
      <span>Sobre este setor ${htmlAjuda(`setor-${idx}-atividade`, setor.nome, explicacaoSetor(setor.nome))}</span>
      <span>Sobre o selo ${htmlAjuda(`setor-${idx}-selo`, `Por que ${textoSelo(setor.selo)}?`, explicacaoSelo(setor))}</span>
    </div>
    <div id="setor-${idx}-ranking" data-ranking-setor="${idx}" hidden>
      <p class="small text-muted mt-2">Comparação com o setor: valores em pontos percentuais (p.p.), não a alta ou queda da ação. Exemplo: ação +3% e setor +1% → diferença de +2 p.p. Mesmo uma ação que caiu pode ficar acima de um setor que caiu mais.</p><ranking-tickers></ranking-tickers>
    </div>
  </li>`;
}

function htmlListaSetores(setores, escala) {
  return `<ul class="list-unstyled mb-2">${setores.map((s, i) => htmlItemSetor(s, i, escala)).join('')}</ul>`;
}

export function cardSetoresEmpresas({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'setores-empresas',
    titulo: 'Setores × Empresas',
    tituloErro: 'Setores indisponíveis',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];

      if (estadoVazioBloco(indisponivel, 'setores') || !panorama?.setores?.length) {
        host.innerHTML = htmlEstadoVazio({
          titulo: 'Setores ainda sem dado',
          causa: 'O gestor ainda não calculou este bloco.',
        }) + htmlRodapePanorama(panorama);
        return;
      }

      const ordenados = setoresOrdenados(panorama.setores.map(normalizarSetor));
      const escala = escalaBarras(ordenados, (s) => s.variacaoMediana);

      host.innerHTML = `<div class="panorama-setores mb-3">
        <h6>Como os preços das ações de cada setor se moveram?</h6>
        <p class="small mb-2">Compare ramos de atividade, como bancos, energia e comércio. Cada linha resume a variação dos preços das ações daquele grupo no período. Clique no setor para comparar suas ações.</p>
        <div class="d-flex flex-wrap gap-3 small text-muted">
          <span>O que é um setor? ${htmlAjuda('panorama-setores-conceito', 'Setores e amostra de ações', 'Setor é um grupo de empresas com atividades relacionadas. Aqui usamos a classificação cadastral. A contagem é de ações (códigos negociados), não necessariamente de empresas diferentes: uma empresa pode ter mais de um tipo de ação. Só entram ações com dados e negociação suficientes. “Outros” agrupa classificações sem grupo próprio.')}</span>
          <span>O que significa a porcentagem? ${htmlAjuda('panorama-setores-variacao', 'Alta e queda dos preços', 'A porcentagem compara o preço de fechamento de cada ação com o fechamento anterior ao início do período. Depois calculamos a mediana do setor: ordenamos as variações e pegamos o valor central (ou a média dos dois centrais). Exemplo: −2%, +1% e +6% resultam em +1%. Não é aumento de lucro, vendas ou dividendos, nem o retorno de uma carteira. Barras à direita indicam alta, à esquerda indicam queda; o comprimento compara a magnitude entre setores.')}</span>
          <span>Como ler os selos? ${htmlAjuda('panorama-setores-selos', 'Misto, andou junto e disperso', 'Os selos mostram a proporção de ações que seguiram a direção da mediana: subiram, caíram ou ficaram estáveis. “Andou junto”: pelo menos 70%. “Misto”: de 50% a menos de 70%. “Disperso”: menos de 50%. Não medem a qualidade das empresas ou a intensidade da variação. “Andou junto” também pode significar que a maioria caiu.')}</span>
          <span>Como comparar as ações? ${htmlAjuda('panorama-setores-destaques', 'Acima e abaixo do setor', 'Os códigos destacados mostram os extremos da diferença entre a variação da ação e a mediana do setor. Acima do setor não significa necessariamente que a ação subiu; ela pode ter caído menos. Abaixo não significa necessariamente queda. A lista expandida mostra essa diferença em pontos percentuais (p.p.). Exemplo: ação −1% e setor −4% → ação 3 p.p. acima do setor.')}</span>
        </div>
        <p class="small text-muted mt-2 mb-0">${panorama.dataInicial && panorama.dataPregao ? `Janela observada: ${escaparHtml(panorama.dataInicial.split('-').reverse().join('/'))} a ${escaparHtml(panorama.dataPregao.split('-').reverse().join('/'))}. ` : ''}Percentual = mediana da variação dos preços · selo = direção em comum · códigos = comparação com o setor.</p>
      </div>` + htmlListaSetores(ordenados, escala) + htmlRodapePanorama(panorama);

      host.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-expandir-setor]');
        if (!btn) return;

        const idx = Number(btn.dataset.expandirSetor);
        const estaExpandido = btn.getAttribute('aria-expanded') === 'true';

        // Colapsa todos os botoes e rankings
        for (const b of host.querySelectorAll('[data-expandir-setor]')) {
          b.setAttribute('aria-expanded', 'false');
        }
        for (const r of host.querySelectorAll('[data-ranking-setor]')) {
          r.hidden = true;
        }

        if (!estaExpandido) {
          const ranking = host.querySelector(`[data-ranking-setor="${idx}"]`);
          if (!ranking) return;
          btn.setAttribute('aria-expanded', 'true');
          ranking.hidden = false;
          const rt = ranking.querySelector('ranking-tickers');
          if (rt) {
            const setor = ordenados[idx];
            rt.rotulos = { maiores: 'Acima do setor (p.p.)', menores: 'Abaixo do setor (p.p.)' };
            rt.direcional = false;
            rt.valor = (item) => item.desvio;
            rt.formatar = (item) => formatarDesvio(item.desvio);
            rt.dados = { maiores: setor.melhores || [], menores: setor.piores || [] };
          }
        }
      });
    },
  };
}
