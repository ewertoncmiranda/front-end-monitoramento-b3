import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { escaparHtml } from '../../../utils/html.js';
import { formatarData } from '../../../utils/dataHora.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';

// Unica responsabilidade: card "Eventos recentes" do carrossel do mercado
// (MERC-PAI-4). Mostra desdobramentos, grupamentos e bonificacoes recentes
// extraidos do panorama do gestor (ate 10 itens).

const TIPOS_LEGIVEIS = {
  DESDOBRAMENTO: 'Desdobramento',
  GRUPAMENTO: 'Grupamento',
  BONIFICACAO: 'Bonificação',
};

function tipoLegivel(tipo) {
  return TIPOS_LEGIVEIS[tipo] || tipo || '';
}

function htmlLinhEvento(evento) {
  const simbolo = String(evento?.simbolo ?? '');
  const tipo = tipoLegivel(evento?.tipo);
  const data = evento?.data ? formatarData(evento.data) : '—';
  const fator = evento?.fator !== null && evento?.fator !== undefined ? String(evento.fator) : '';
  return `<li class="card-eventos__linha d-flex align-items-center gap-2 py-1 border-bottom">
    <a class="fw-semibold text-body" href="#/ativo/${escaparHtml(encodeURIComponent(simbolo))}">${escaparHtml(simbolo)}</a>
    <span class="badge text-bg-secondary flex-shrink-0">${escaparHtml(tipo)}</span>
    <span class="small text-muted">${escaparHtml(data)}</span>
    ${fator ? `<span class="small ms-auto">${escaparHtml(fator)}</span>` : ''}
  </li>`;
}

export function cardEventos({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'eventos-recentes',
    titulo: 'Eventos recentes',
    tituloErro: 'Eventos indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];
      const lista = Array.isArray(panorama?.eventos) ? panorama.eventos.slice(0, 10) : [];

      if (indisponivel.includes('eventos') || !lista.length) {
        host.innerHTML = htmlEstadoVazio({
          titulo: 'Eventos recentes ainda sem dado',
          causa: 'O gestor ainda não encontrou eventos corporativos neste período.',
        }) + htmlRodapePanorama(panorama);
        return;
      }

      host.innerHTML = `<ul class="list-unstyled mb-0 card-eventos__lista">
        ${lista.map(htmlLinhEvento).join('')}
      </ul>${htmlRodapePanorama(panorama)}`;
    },
  };
}
