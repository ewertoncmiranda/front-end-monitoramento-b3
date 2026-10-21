import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { escaparHtml } from '../../../utils/html.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';
import '../RankingTickers.js';

// Unica responsabilidade: card "Volume fora do normal" do carrossel do mercado
// (MERC-PAI-4). Mostra as acoes com maior volume relativo (volume do pregao
// dividido pela media dos ultimos 21 pregoes) via <ranking-tickers>.
// Sem coluna "menores": so a coluna esquerda e preenchida.

export function cardVolumeAnormal({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'volume-anormal',
    titulo: 'Volume fora do normal',
    tituloErro: 'Volume anormal indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];
      const lista = Array.isArray(panorama?.volumeAnormal) ? panorama.volumeAnormal : [];

      if (indisponivel.includes('volumeAnormal') || !lista.length) {
        host.innerHTML = htmlEstadoVazio({
          titulo: 'Volume anormal ainda sem dado',
          causa: 'O gestor ainda não calculou este bloco.',
        }) + htmlRodapePanorama(panorama);
        return;
      }

      host.innerHTML = `<p class="small text-muted mb-2">Volume do pregão ÷ média de 21 pregões. Ação com razão 3× negociou 3 vezes mais que o normal.</p>
        <ranking-tickers></ranking-tickers>${htmlRodapePanorama(panorama)}`;

      const ranking = host.querySelector('ranking-tickers');
      ranking.rotulos = { maiores: 'Maior volume relativo', menores: '' };
      ranking.direcional = false;
      ranking.valor = (item) => item.razao;
      ranking.formatar = (item) => `${escaparHtml(item.razao.toFixed(1).replace('.', ','))}× a média`;
      ranking.dados = { maiores: lista, menores: [] };
    },
  };
}
