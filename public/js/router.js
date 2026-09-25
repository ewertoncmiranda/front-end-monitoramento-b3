// Unica responsabilidade: mapear a rota (hash) para a pagina correspondente e
// montar essa pagina no outlet.
//
// Roteamento por hash (#/rota) funciona em qualquer hospedagem estatica e
// dentro de WebViews sem precisar de configuracao de servidor para
// reescrever URLs - diferente de roteamento via History API.
const rotas = {
  '#/consulta': 'consulta-page',
  '#/cadastro': 'cadastro-page',
  '#/monitorados': 'ativos-monitorados-page',
  '#/metodologia': 'metodologia-page',
  '#/formulas': 'formulas-page',
  '#/arquitetura': 'arquitetura-page',
};

const ROTA_PADRAO = '#/consulta';

export function iniciarRouter(outletSelector) {
  const outlet = document.querySelector(outletSelector);

  function renderizarRotaAtual() {
    const hash = window.location.hash || ROTA_PADRAO;
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
