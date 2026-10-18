// CART-PAI-7 / CARTDB-PAI-1..2 — testes da CarteirasPage.
import assert from 'node:assert/strict';

// Mock mínimo do ambiente de browser
globalThis.HTMLElement = class {
  innerHTML = '';
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {}
};
globalThis.customElements = { define() {} };
globalThis.CSS = { escape: (s) => s };

const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.get(k) ?? null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
};

const {
  CarteirasPage, htmlImportacao, htmlListaCarteiras, htmlResultadoImportacao,
} = await import('../public/js/pages/CarteirasPage.js');
const { paginaDaRota } = await import('../public/js/router.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const carteira = { id: 'c1', nome: 'Teste', estrategia: 'Graham', cor: '#0d6efd', criadaEm: '2026-10-01T10:00:00', ativos: [] };

caso('lista vazia convida a criar a primeira carteira', () => {
  assert.match(htmlListaCarteiras([]), /Nenhuma carteira criada ainda[\s\S]*data-acao="nova-carteira"/);
});

caso('uma carteira vira um card com cabecalho e formulario de ativo', () => {
  const html = htmlListaCarteiras([carteira]);
  assert.match(html, /data-carteira-id="c1"/);
  assert.match(html, /<carteira-cabecalho>/);
  assert.match(html, /<carteira-adicionar-ativo>/);
  assert.doesNotMatch(html, /<table/, 'sem ativos, sem tabela');
});

caso('carteira com ativos ganha tabela e uma linha por ativo', () => {
  const html = htmlListaCarteiras([{ ...carteira, ativos: [{ simbolo: 'PETR4' }, { simbolo: 'VALE3' }] }]);
  assert.equal((html.match(/<carteira-ativo-linha/g) || []).length, 2);
});

caso('_renderizarCarteiras passa ao formulario os tickers ja presentes', () => {
  const pagina = new CarteirasPage();
  let idRecebido = null;
  let simbolos = null;
  const card = {
    querySelector: (sel) => (sel === 'carteira-adicionar-ativo'
      ? { setCarteiraId: (id, s) => { idRecebido = id; simbolos = s; } }
      : sel === 'carteira-cabecalho' ? { setCarteira() {} } : null),
    querySelectorAll: () => [],
  };
  const lista = { innerHTML: '', querySelector: (sel) => (sel === '[data-carteira-id="c1"]' ? card : null) };
  pagina.querySelector = (sel) => (sel === '#lista-carteiras' ? lista : null);
  pagina._renderizarCarteiras([{ ...carteira, ativos: [{ simbolo: 'PETR4' }] }]);
  assert.equal(idRecebido, 'c1');
  assert.deepEqual(simbolos, ['PETR4']);
});

caso('pagina explica persistencia no gestor e que nao ha separacao por usuario', () => {
  const html = new CarteirasPage().template();
  assert.match(html, /salvas no gestor/);
  assert.match(html, /não há separação por usuário/);
  assert.match(html, /alocação simulada/);
  assert.doesNotMatch(html, /Modo navegador/);
});

caso('importacao: so aparece com carteiras locais e lista os nomes escapados', () => {
  assert.equal(htmlImportacao([]), '');
  const html = htmlImportacao([{ id: 'c_1', nome: '<b>Minha</b>' }]);
  assert.match(html, /1 carteira\(s\) deste navegador/);
  assert.match(html, /&lt;b&gt;Minha&lt;\/b&gt;/);
  assert.match(html, /data-acao="importar"/);
});

caso('resultado: sucesso conta novas e ja existentes; copia do navegador apagada', () => {
  const html = htmlResultadoImportacao({ resposta: { importadas: 2, jaExistentes: 1 }, avisos: ['A: PETR4 repetido'] });
  assert.match(html, /alert-success[\s\S]*cópia do navegador foi apagada/);
  assert.match(html, /2 carteira\(s\) nova\(s\) no gestor, 1 já estava\(m\) lá \(nada duplicado\)/);
  assert.match(html, /PETR4 repetido/);
});

caso('resultado: falha (ex.: 409) diz que nada foi gravado e a copia foi mantida', () => {
  const erro = Object.assign(new Error('x'), { status: 409 });
  const html = htmlResultadoImportacao({ erro, avisos: [] });
  assert.match(html, /alert-warning[\s\S]*nada foi gravado e a cópia do navegador foi mantida/);
  assert.match(html, /mesmo id e conteúdo diferente/);
});

caso('paginaDaRota inclui carteiras-page', () => {
  assert.equal(paginaDaRota('#/carteiras'), 'carteiras-page');
});

console.log(`\n  ${casos} caso(s) passaram.`);
