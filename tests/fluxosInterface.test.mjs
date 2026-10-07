// ISS-03: navegação hash e filtragem combinada exercitadas como o componente usa.
import assert from 'node:assert/strict';

function classeFake() {
  const valores = new Set();
  return {
    toggle(nome, ativo) { ativo ? valores.add(nome) : valores.delete(nome); },
    add(nome) { valores.add(nome); },
    contains(nome) { return valores.has(nome); },
  };
}

const listeners = {};
const outlet = { innerHTML: '' };
globalThis.window = {
  location: { hash: '#/estudos?visao=biblioteca' },
  addEventListener(tipo, callback) { listeners[tipo] = callback; },
};
globalThis.document = {
  querySelector(seletor) {
    assert.equal(seletor, '#app');
    return outlet;
  },
};

const { iniciarRouter } = await import('../public/js/router.js');
iniciarRouter('#app');
assert.equal(outlet.innerHTML, '<estudos-page></estudos-page>');

window.location.hash = '#/gestao/PETR4?aba=fatores';
listeners.hashchange();
assert.equal(outlet.innerHTML, '<gestao-page></gestao-page>');

window.location.hash = '#/rota-inexistente';
listeners.hashchange();
assert.equal(outlet.innerHTML, '<inicio-page></inicio-page>');

window.location.hash = '';
iniciarRouter('#app');
assert.equal(window.location.hash, '#/inicio');

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
window.localStorage = null;
window.history = { replaceState() {} };

const { EstudosPage } = await import('../public/js/pages/EstudosPage.js');

function card({ busca, nivel, escopo, tipo }) {
  return {
    dataset: {
      estudoBusca: busca,
      cursoNivel: nivel,
      cursoEscopo: escopo,
      cursoTipo: tipo,
    },
    classList: classeFake(),
    matches(seletor) { return seletor === '[data-curso-card]'; },
  };
}

const cards = [
  card({ busca: 'renda fixa risco juros', nivel: 'basico', escopo: 'curso focal', tipo: 'macro' }),
  card({ busca: 'renda variavel risco acoes', nivel: 'basico', escopo: 'curso focal', tipo: 'fundamentos' }),
  card({ busca: 'derivativos opcoes risco', nivel: 'avancado', escopo: 'formacao completa', tipo: 'derivativos' }),
];
const busca = { value: 'risco' };
const nivel = { value: 'basico' };
const escopo = { value: 'curso focal' };
const tipo = { value: 'fundamentos' };
const vazio = { classList: classeFake() };
const contagem = { textContent: '' };
const seletores = new Map([
  ['#estudos-busca', busca],
  ['[data-curso-filtro="nivel"]', nivel],
  ['[data-curso-filtro="escopo"]', escopo],
  ['[data-curso-filtro="tipo"]', tipo],
  ['#estudos-vazio', vazio],
  ['#estudos-contagem', contagem],
]);
const pagina = {
  secao: 'formacoes',
  visaoFormacao: 'biblioteca',
  cursoAberto: null,
  subConhecimento: 'conceitos',
  sincronizarUrl() { this.urlSincronizada = true; },
  querySelector(seletor) { return seletores.get(seletor) || null; },
  querySelectorAll(seletor) {
    assert.equal(seletor, '[data-estudo-busca]');
    return cards;
  },
};

EstudosPage.prototype.filtrar.call(pagina);
assert.equal(pagina.urlSincronizada, true);
assert.deepEqual(cards.map(item => item.classList.contains('d-none')), [true, false, true]);
assert.equal(contagem.textContent, '1 resultado(s) nesta seção');
assert.equal(vazio.classList.contains('d-none'), true);

tipo.value = 'derivativos';
EstudosPage.prototype.filtrar.call(pagina);
assert.deepEqual(cards.map(item => item.classList.contains('d-none')), [true, true, true]);
assert.equal(contagem.textContent, '0 resultado(s) nesta seção');
assert.equal(vazio.classList.contains('d-none'), false);

console.log('fluxosInterface.test.mjs ok');
