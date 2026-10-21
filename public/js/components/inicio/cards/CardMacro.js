import { buscarPanorama, JANELA_PADRAO } from '../../../api/mercadoApi.js';
import { escaparHtml } from '../../../utils/html.js';
import { htmlEstadoVazio } from '../../EstadoVazio.js';
import { htmlRodapePanorama } from '../cardPanoramaProvisorio.js';

// Unica responsabilidade: card "Indicadores macro" do carrossel do mercado
// (MERC-PAI-4). Mostra Selic, CDI no periodo, Dolar e IPCA 12m em grade 2x2.
// Selic e IPCA sao pontuais — nao mudam com o seletor de janela.

/** Formata taxa anual (0.15 → '15,00% a.a.'). */
export function formatarTaxaAa(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${(valor * 100).toFixed(2).replace('.', ',')}% a.a.`;
}

/** Formata variacao percentual no periodo (0.0028 → '+0,28% no período'). */
export function formatarVariacaoPeriodo(valor) {
  if (valor === null || valor === undefined) return '—';
  const pct = valor * 100;
  const sinal = pct >= 0 ? '+' : '';
  return `${sinal}${pct.toFixed(2).replace('.', ',')}% no período`;
}

/** Formata valor em reais (5.42 → 'R$ 5,42'). */
export function formatarDolar(valor) {
  if (valor === null || valor === undefined) return '—';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function htmlItemMacro(rotulo, valor) {
  return `<div class="card-macro__item">
    <span class="card-macro__rotulo small text-muted">${escaparHtml(rotulo)}</span>
    <span class="card-macro__valor fw-semibold">${escaparHtml(valor)}</span>
  </div>`;
}

export function cardMacro({ buscar = buscarPanorama, janela = JANELA_PADRAO } = {}) {
  return {
    id: 'macro',
    titulo: 'Indicadores macro',
    tituloErro: 'Macro indisponível',
    async render(host) {
      const panorama = await buscar(janela);
      const indisponivel = Array.isArray(panorama?.indisponivel) ? panorama.indisponivel : [];

      if (indisponivel.includes('macro')) {
        host.innerHTML = htmlEstadoVazio({
          titulo: 'Indicadores macro ainda sem dado',
          causa: 'O gestor ainda não calculou este bloco.',
        }) + htmlRodapePanorama(panorama);
        return;
      }

      const macro = panorama?.macro || {};
      const itens = [
        htmlItemMacro('Selic', formatarTaxaAa(macro.selic ?? null)),
        htmlItemMacro('CDI no período', formatarVariacaoPeriodo(macro.cdiPeriodo ?? null)),
        htmlItemMacro('Dólar', formatarDolar(macro.dolar ?? null)),
        htmlItemMacro('IPCA 12 meses', formatarTaxaAa(macro.ipca12m ?? null)),
      ].join('');

      host.innerHTML = `<p class="small text-muted mb-2">Selic e IPCA são pontuais — não mudam com o seletor de período.</p>
        <div class="card-macro__grade">${itens}</div>
        ${htmlRodapePanorama(panorama)}`;
    },
  };
}
