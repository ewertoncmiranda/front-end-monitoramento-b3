import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { escaparHtml } from '../../../utils/html.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';
import '../RankingTickers.js';
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
  const v = setor.variacaoMediana ?? 0;
  const pct = escala > 0 ? Math.round(Math.abs(v) / escala * 50) : 0;
  const barLeft = v >= 0 ? '50%' : `${50 - pct}%`;
  const corBarra = v >= 0 ? 'var(--f360-compra)' : 'var(--f360-venda)';
  const corTexto = v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-muted';
  const ehOutros = setor.nome === 'Outros';
  const melhor = !ehOutros ? (setor.melhores?.[0] ?? null) : null;
  const pior = !ehOutros ? (setor.piores?.[0] ?? null) : null;
  const liquidos = setor.universo?.liquidos;

  return `<li class="border-bottom py-2">
    <button type="button"
      class="d-flex align-items-center gap-2 w-100 btn btn-link p-0 text-start text-decoration-none text-body"
      data-expandir-setor="${idx}"
      aria-expanded="false"
      aria-controls="setor-${idx}-ranking">
      <span class="fw-semibold small" style="min-width:7rem;flex-shrink:0">${escaparHtml(setor.nome)}</span>
      <span class="flex-grow-1 position-relative d-block"
        aria-hidden="true"
        style="height:.4rem;background:var(--f360-superficie-2);border-radius:.25rem;overflow:hidden">
        <span class="position-absolute h-100 d-block"
          style="left:${barLeft};width:${pct}%;background:${corBarra};border-radius:.25rem"></span>
      </span>
      <span class="small ${corTexto} font-monospace" style="min-width:4.5rem;text-align:right">${escaparHtml(formatarVariacaoSetor(v))}</span>
      ${liquidos !== null && liquidos !== undefined ? `<span class="small text-muted" style="min-width:4rem">${escaparHtml(liquidos)} emp.</span>` : ''}
      <span class="badge text-bg-secondary">${escaparHtml(textoSelo(setor.selo))}</span>
      ${melhor ? `<span class="badge text-bg-success" title="${escaparHtml(`Destaque: ${melhor.nome || melhor.simbolo}`)}">${escaparHtml(melhor.simbolo)}</span>` : ''}
      ${pior ? `<span class="badge text-bg-danger" title="${escaparHtml(`Ficou para trás: ${pior.nome || pior.simbolo}`)}">${escaparHtml(pior.simbolo)}</span>` : ''}
    </button>
    <div id="setor-${idx}-ranking" data-ranking-setor="${idx}" hidden>
      <ranking-tickers></ranking-tickers>
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

      const ordenados = setoresOrdenados(panorama.setores);
      const escala = escalaBarras(ordenados, (s) => s.variacaoMediana);

      host.innerHTML = htmlListaSetores(ordenados, escala) + htmlRodapePanorama(panorama);

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
            rt.rotulos = { maiores: 'Destaques', menores: 'Ficaram para trás' };
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
