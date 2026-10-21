import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';
import { escaparHtml } from '../../../utils/html.js';

// Unica responsabilidade: card "Amplitude do mercado" do carrossel (MERC-PAI-3).
// Mostra quantas acoes subiram, cairam ou ficaram estaveis, e o percentual
// acima da media movel de 21 pregoes. Sem <ranking-tickers>.

function htmlAmplitude(amplitude) {
  const subiram = amplitude?.subiram ?? '–';
  const cairam = amplitude?.cairam ?? '–';
  const estaveis = amplitude?.estaveis ?? '–';
  const pctAcima = amplitude?.pctAcimaMm21;
  const pctTexto = pctAcima !== null && pctAcima !== undefined
    ? `${escaparHtml(Number(pctAcima * 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }))}`
    : null;

  return `<div class="d-flex gap-3 justify-content-around mb-3">
    <div class="text-center">
      <div class="fs-3 fw-bold" style="color:var(--f360-alta, var(--bs-success))">${escaparHtml(subiram)}</div>
      <div class="small text-muted">subiram</div>
    </div>
    <div class="text-center">
      <div class="fs-3 fw-bold" style="color:var(--f360-queda, var(--bs-danger))">${escaparHtml(cairam)}</div>
      <div class="small text-muted">caíram</div>
    </div>
    <div class="text-center">
      <div class="fs-3 fw-bold text-muted">${escaparHtml(estaveis)}</div>
      <div class="small text-muted">estáveis</div>
    </div>
  </div>
  ${pctTexto !== null ? `<p class="small text-muted text-center mb-0">${pctTexto}% das ações acima da média de 21 pregões</p>` : ''}`;
}

export function cardAmplitude({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'amplitude',
    titulo: 'Amplitude do mercado',
    tituloErro: 'Panorama indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];
      if (indisponivel.includes('amplitude')) {
        host.innerHTML = htmlEstadoVazio({ titulo: 'Amplitude ainda sem dado', causa: 'O gestor ainda não calculou este bloco.' })
          + htmlRodapePanorama(panorama);
        return;
      }
      host.innerHTML = htmlAmplitude(panorama?.amplitude) + htmlRodapePanorama(panorama);
    },
  };
}
