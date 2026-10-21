import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';

// Unica responsabilidade: card "Maiores altas e quedas" do carrossel do mercado
// (MERC-PAI-3). Substitui o cardPanoramaProvisorio na InicioPage.

export function cardAltasQuedas({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'altas-quedas',
    titulo: 'Maiores altas e quedas',
    tituloErro: 'Panorama indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];
      if (indisponivel.includes('altas') && indisponivel.includes('quedas')) {
        host.innerHTML = htmlEstadoVazio({ titulo: 'Altas e quedas ainda sem dado', causa: 'O gestor ainda não calculou este bloco.' })
          + htmlRodapePanorama(panorama);
        return;
      }
      host.innerHTML = `<ranking-tickers></ranking-tickers>${htmlRodapePanorama(panorama)}`;
      const ranking = host.querySelector('ranking-tickers');
      ranking.rotulos = { maiores: 'Maiores altas', menores: 'Maiores quedas' };
      ranking.direcional = true;
      ranking.escalaComum = true;
      ranking.dados = { maiores: panorama?.altas || [], menores: panorama?.quedas || [] };
    },
  };
}
