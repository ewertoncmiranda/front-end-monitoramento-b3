import { buscarPanorama, JANELA_PADRAO } from '../../api/mercadoApi.js';
import { escaparHtml } from '../../utils/html.js';
import { formatarData } from '../../utils/dataHora.js';
import { htmlEstadoVazio } from '../EstadoVazio.js';
import './RankingTickers.js';

// Unica responsabilidade: card PROVISORIO do carrossel da Inicio (MERC-PAI-1)
// enquanto os cards reais (MERC-PAI-2/3/4) nao existem. Mostra as altas e
// quedas do panorama com <ranking-tickers>; sem gestor, "Panorama indisponível".
// Sera substituido pelo CardAltasQuedas (MERC-PAI-3).

const ROTULOS_JANELA = { '1d': '1 dia', '5d': '5 dias', '21d': '21 dias', ano: 'no ano' };

/** Rodape honesto: data do pregao e universo; nunca finge tempo real. */
export function htmlRodapePanorama(panorama) {
  const partes = [];
  const liquidos = panorama?.universo?.liquidos;
  if (liquidos !== null && liquidos !== undefined) partes.push(`${escaparHtml(liquidos)} ações líquidas`);
  if (panorama?.dataPregao) partes.push(`pregão de ${escaparHtml(formatarData(panorama.dataPregao))}`);
  const janela = ROTULOS_JANELA[panorama?.janela] || panorama?.janela;
  if (janela) partes.push(`período: ${escaparHtml(janela)}`);
  return partes.length ? `<p class="small text-muted mt-2 mb-0">${partes.join(' · ')}</p>` : '';
}

export function cardPanoramaProvisorio({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'altas-quedas-provisorio',
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
      host.innerHTML = `<p class="small text-muted mb-2">Variação no período entre as ações líquidas. Prévia: os cards completos do panorama ainda estão a caminho.</p>
        <ranking-tickers></ranking-tickers>${htmlRodapePanorama(panorama)}`;
      const ranking = host.querySelector('ranking-tickers');
      ranking.rotulos = { maiores: 'Maiores altas', menores: 'Maiores quedas' };
      ranking.escalaComum = true;
      ranking.dados = { maiores: panorama?.altas || [], menores: panorama?.quedas || [] };
    },
  };
}
