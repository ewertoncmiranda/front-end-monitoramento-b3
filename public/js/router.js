// Unica responsabilidade: mapear a rota (hash) para a pagina correspondente e
// montar essa pagina no outlet.
//
// Roteamento por hash (#/rota) funciona em qualquer hospedagem estatica e
// dentro de WebViews sem precisar de configuracao de servidor para
// reescrever URLs - diferente de roteamento via History API.
import { carregarSecao } from './components/ficha360/manifesto.js';
import { lerUltimo, redirecionamento } from './components/ficha360/rotaFicha.js';

const rotas = {
  '#/inicio': 'inicio-page',
  '#/ativo': 'ficha-ativo-page',
  '#/gestao': 'gestao-page',
  '#/ativos': 'ativos-page',
  // Rotas antigas das listas abrem a tabela unica na visao correspondente (REQ-UX-8).
  '#/base': 'ativos-page',
  '#/favoritos': 'ativos-page',
  '#/monitorados': 'ativos-page',
  '#/candles': 'candles-page',
  '#/comunicados': 'comunicados-page',
  '#/noticias': 'noticias-page',
  '#/formulas': 'formulas-page',
  '#/arquitetura': 'arquitetura-page',
  '#/design-codigo': 'design-codigo-page',
  '#/avaliacao': 'avaliacao-page',
  '#/padroes': 'padroes-page',
  '#/glossario': 'glossario-page',
  '#/estudos': 'estudos-page',
  '#/setores': 'ativos-page',
  '#/indices': 'indices-macro-page',
  '#/opcoes': 'opcao-page',
  '#/assistente': 'assistente-page',
  '#/operabilidade': 'operabilidade-page',
  '#/simulador': 'simulador-page',
};

const ROTA_PADRAO = '#/inicio';

/** Pagina da rota; `#/ativo/PETR4` e `#/opcoes/PETR4` levam o simbolo como parametro. */
export function paginaDaRota(hash) {
  // `#/glossario?padrao=martelo`: o que vem depois do `?` e parametro da
  // pagina (ela mesma le), nao parte da rota.
  const caminho = String(hash || ROTA_PADRAO).split('?')[0];
  return rotas[caminho]
    || (caminho.startsWith('#/ativo/') ? rotas['#/ativo'] : null)
    || (caminho.startsWith('#/opcoes/') ? rotas['#/opcoes'] : null)
    || rotas[ROTA_PADRAO];
}

export function iniciarRouter(outletSelector) {
  const outlet = document.querySelector(outletSelector);
  let rodada = 0;

  async function renderizarRotaAtual() {
    const minha = ++rodada;
    const hash = window.location.hash || ROTA_PADRAO;
    const ultimo = lerUltimo();
    // #/candles so vira a ficha quando a secao Grafico existe; antes disso a
    // tela de velas continua como estava.
    const temGrafico = hash.split('?')[0] === '#/candles' && ultimo ? await carregarSecao('grafico') : false;
    if (minha !== rodada) return;
    // Ficha antiga (#/gestao/X, #/ficha/X) e #/candles viram a ficha nova.
    const destino = redirecionamento(hash, { ultimo, temGrafico });
    if (destino) {
      window.location.replace(destino);
      return;
    }
    const tagName = paginaDaRota(hash);
    outlet.innerHTML = `<${tagName}></${tagName}>`;
  }

  window.addEventListener('hashchange', renderizarRotaAtual);

  if (!window.location.hash) {
    window.location.hash = ROTA_PADRAO;
  } else {
    renderizarRotaAtual();
  }
}
