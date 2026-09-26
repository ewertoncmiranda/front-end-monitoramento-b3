// Unica responsabilidade: mapear a rota (hash) para a pagina correspondente e
// montar essa pagina no outlet.
//
// Roteamento por hash (#/rota) funciona em qualquer hospedagem estatica e
// dentro de WebViews sem precisar de configuracao de servidor para
// reescrever URLs - diferente de roteamento via History API.
const rotas = {
  '#/gestao': 'gestao-page',
  '#/monitorados': 'ativos-monitorados-page',
  '#/candles': 'candles-page',
  '#/comunicados': 'comunicados-page',
  '#/formulas': 'formulas-page',
  '#/arquitetura': 'arquitetura-page',
  '#/avaliacao': 'avaliacao-page',
  '#/padroes': 'padroes-page',
  '#/glossario': 'glossario-page',
  '#/estudos': 'estudos-page',
  '#/setores': 'setores-page',
  '#/indices': 'indices-macro-page',
};

const ROTA_PADRAO = '#/gestao';

export function iniciarRouter(outletSelector) {
  const outlet = document.querySelector(outletSelector);

  function renderizarRotaAtual() {
    // `#/glossario?padrao=martelo`: o que vem depois do `?` e parametro da
    // pagina (ela mesma le), nao parte da rota.
    const hash = (window.location.hash || ROTA_PADRAO).split('?')[0];
    const tagName = rotas[hash] || rotas[ROTA_PADRAO];
    outlet.innerHTML = `<${tagName}></${tagName}>`;
  }

  window.addEventListener('hashchange', renderizarRotaAtual);

  if (!window.location.hash) {
    window.location.hash = ROTA_PADRAO;
  } else {
    renderizarRotaAtual();
  }
}
