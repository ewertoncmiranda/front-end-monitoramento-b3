import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';
import { formatarVolume } from '../../../utils/numero.js';

// Unica responsabilidade: card "Liquidez" do carrossel do mercado (MERC-PAI-3).
// Mostra as acoes mais e menos liquidas (volume medio de 63 pregoes).
// Nao depende do seletor de periodo; aviso fixo informa isso ao usuario.

/** Texto de selo por item baseado no spread estimado (sem HTML; valor e escapado pelo RankingTickers). */
function seloLiquidez(item) {
  const spread = item?.spreadEstimado;
  if (spread !== null && spread !== undefined && spread <= 0.001) return 'boa para operar';
  if (spread !== null && spread !== undefined && spread >= 0.01) return 'cuidado com spread';
  return null;
}

/** Adiciona o selo como texto secundario no campo setor do item. */
function enriquecerItem(item) {
  const selo = seloLiquidez(item);
  if (!selo) return item;
  const base = item.setor ? `${item.setor} · ` : '';
  return { ...item, setor: `${base}${selo}` };
}

export function cardLiquidez({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'liquidez',
    titulo: 'Liquidez',
    tituloErro: 'Panorama indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];
      if (indisponivel.includes('liquidez')) {
        host.innerHTML = htmlEstadoVazio({ titulo: 'Liquidez ainda sem dado', causa: 'O gestor ainda não calculou este bloco.' })
          + htmlRodapePanorama(panorama);
        return;
      }
      const dadosLiquidez = panorama?.liquidez || {};
      const maiores = (dadosLiquidez.maiores || []).map(enriquecerItem);
      const menores = (dadosLiquidez.menores || []).map(enriquecerItem);
      host.innerHTML = `<p class="small text-muted mb-2">Calculado sobre o volume médio de 63 pregões. Não muda com o seletor de período.</p>
        <ranking-tickers></ranking-tickers>${htmlRodapePanorama(panorama)}`;
      const ranking = host.querySelector('ranking-tickers');
      ranking.rotulos = { maiores: 'Mais líquidas', menores: 'Menos líquidas' };
      ranking.direcional = false;
      ranking.valor = (item) => item.volumeMedio63d;
      ranking.formatar = (item) => formatarVolume(item.volumeMedio63d);
      ranking.dados = { maiores, menores };
    },
  };
}
