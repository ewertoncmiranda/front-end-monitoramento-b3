import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';
import { formatarVolume } from '../../../utils/numero.js';

// Unica responsabilidade: card "Negociacao" do carrossel do mercado (MERC-PAI-3).
// Mostra as acoes mais e menos negociadas no periodo selecionado.

/** Formata o numero de negocios como texto descritivo (ex.: "345.227 negócios"). */
function formatarNegocios(negocios) {
  if (negocios === null || negocios === undefined) return null;
  return `${Number(negocios).toLocaleString('pt-BR')} negócios`;
}

/** Adiciona o contador de negocios como texto secundario no campo setor do item. */
function enriquecerItem(item) {
  const neg = formatarNegocios(item?.negocios);
  if (!neg) return item;
  const base = item.setor ? `${item.setor} · ` : '';
  return { ...item, setor: `${base}${neg}` };
}

export function cardNegociacao({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'negociacao',
    titulo: 'Mais negociadas',
    tituloErro: 'Panorama indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];
      if (indisponivel.includes('negociacao')) {
        host.innerHTML = htmlEstadoVazio({ titulo: 'Negociação ainda sem dado', causa: 'O gestor ainda não calculou este bloco.' })
          + htmlRodapePanorama(panorama);
        return;
      }
      const dadosNeg = panorama?.negociacao || {};
      const maiores = (dadosNeg.maiores || []).map(enriquecerItem);
      const menores = (dadosNeg.menores || []).map(enriquecerItem);
      host.innerHTML = `<ranking-tickers></ranking-tickers>${htmlRodapePanorama(panorama)}`;
      const ranking = host.querySelector('ranking-tickers');
      ranking.rotulos = { maiores: 'Mais negociadas', menores: 'Menos negociadas' };
      ranking.direcional = false;
      ranking.valor = (item) => item.volumeFinanceiro;
      ranking.formatar = (item) => formatarVolume(item.volumeFinanceiro);
      ranking.dados = { maiores, menores };
    },
  };
}
