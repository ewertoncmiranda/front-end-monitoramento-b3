// CART-PAI-7 — testes da CarteirasPage.
import assert from 'node:assert/strict';

// Mock mínimo do ambiente de browser
globalThis.HTMLElement = class {
  innerHTML = '';
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {}
};
globalThis.customElements = { define() {} };

// Mock do localStorage para o store
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.get(k) ?? null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
};

const { listarCarteiras } = await import('../public/js/utils/carteirasStore.js');
const { CarteirasPage } = await import('../public/js/pages/CarteirasPage.js');
const { paginaDaRota } = await import('../public/js/router.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

// ── helpers ──────────────────────────────────────────────────────────────────

function criarPagina() {
  return new CarteirasPage();
}

// ── casos ────────────────────────────────────────────────────────────────────

caso('_renderizarCarteiras exibe mensagem quando lista vazia', () => {
  _storage.delete('b3-carteiras');

  const pagina = criarPagina();

  // Simula o querySelector retornando um elemento de lista falso
  let htmlSetado = '';
  const listaEl = {
    innerHTML: '',
    querySelector: () => null,
  };
  Object.defineProperty(listaEl, 'innerHTML', {
    get() { return htmlSetado; },
    set(v) { htmlSetado = v; },
  });
  pagina.querySelector = (sel) => sel === '#lista-carteiras' ? listaEl : null;

  pagina._renderizarCarteiras();

  assert.ok(htmlSetado.includes('Nenhuma carteira'), `Esperava "Nenhuma carteira" mas obteve: ${htmlSetado}`);
});

caso('_renderizarCarteiras renderiza uma carteira', () => {
  const carteira = {
    id: 'c1',
    nome: 'Teste',
    estrategia: 'Graham',
    cor: '#0d6efd',
    criadaEm: new Date().toISOString(),
    ativos: [],
  };
  _storage.set('b3-carteiras', JSON.stringify({ carteiras: [carteira] }));

  const pagina = criarPagina();

  let htmlSetado = '';
  const listaEl = {
    innerHTML: '',
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  Object.defineProperty(listaEl, 'innerHTML', {
    get() { return htmlSetado; },
    set(v) { htmlSetado = v; },
  });
  pagina.querySelector = (sel) => sel === '#lista-carteiras' ? listaEl : null;

  pagina._renderizarCarteiras();

  // O nome da carteira fica dentro do <carteira-cabecalho> (via setCarteira),
  // mas o data-carteira-id identifica univocamente o card gerado.
  assert.ok(
    htmlSetado.includes('data-carteira-id="c1"'),
    `Esperava card com data-carteira-id="c1" mas obteve: ${htmlSetado}`,
  );
  assert.ok(
    htmlSetado.includes('<carteira-cabecalho>'),
    `Esperava <carteira-cabecalho> mas obteve: ${htmlSetado}`,
  );
});

caso('paginaDaRota inclui carteiras-page', () => {
  assert.equal(paginaDaRota('#/carteiras'), 'carteiras-page');
});

console.log(`\n  ${casos} caso(s) passaram.`);
