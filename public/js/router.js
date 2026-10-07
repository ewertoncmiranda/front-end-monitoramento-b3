// Unica responsabilidade: mapear a rota (hash) para a pagina correspondente e
// montar essa pagina no outlet.
//
// Roteamento por hash (#/rota) funciona em qualquer hospedagem estatica e
// dentro de WebViews sem precisar de configuracao de servidor para
// reescrever URLs - diferente de roteamento via History API.
const rotas = {
  '#/inicio': 'inicio-page',
  '#/gestao': 'gestao-page',
  '#/base': 'base-page',
  '#/favoritos': 'favoritos-page',
  '#/monitorados': 'ativos-monitorados-page',
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
  '#/setores': 'setores-page',
  '#/indices': 'indices-macro-page',
};

const ROTA_PADRAO = '#/inicio';

export function iniciarRouter(outletSelector) {
  const outlet = document.querySelector(outletSelector);

  function renderizarRotaAtual() {
    // `#/glossario?padrao=martelo`: o que vem depois do `?` e parametro da
    // pagina (ela mesma le), nao parte da rota.
    const hash = (window.location.hash || ROTA_PADRAO).split('?')[0];
    // `#/gestao/PETR4`: o simbolo e parametro de rota (a propria GestaoPage
    // le de window.location.hash), nao uma rota nova - so o prefixo importa
    // pra escolher a pagina.
    const tagName = rotas[hash] || (hash.startsWith('#/gestao/') ? rotas['#/gestao'] : null) || rotas[ROTA_PADRAO];
    outlet.innerHTML = `<${tagName}></${tagName}>`;
  }

  window.addEventListener('hashchange', renderizarRotaAtual);

  if (!window.location.hash) {
    window.location.hash = ROTA_PADRAO;
  } else {
    renderizarRotaAtual();
  }
}
