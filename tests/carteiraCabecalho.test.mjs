// CART-PAI-5 — testes unitários de CarteiraCabecalho.
import assert from 'node:assert/strict';

// Mock mínimo de Custom Elements (sem Shadow DOM)
globalThis.HTMLElement = class {
  innerHTML = '';
  querySelector = () => null;
  querySelectorAll = () => [];
};
globalThis.customElements = { define() {} };

// Mock localStorage para carteirasStore (importado indiretamente)
const _ls = new Map();
globalThis.localStorage = {
  getItem: (k) => _ls.get(k) ?? null,
  setItem: (k, v) => _ls.set(k, String(v)),
  removeItem: (k) => _ls.delete(k),
};

const { calcularPatrimonio, calcularRetornoMedioPonderado, CarteiraCabecalho } =
  await import('../public/js/components/carteiras/CarteiraCabecalho.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

// --- helpers ---
function novaCarteira(ativos = []) {
  return {
    id: 1,
    nome: 'Carteira Teste',
    estrategia: 'Dividendos',
    cor: '#3498db',
    criadaEm: '2026-01-01T00:00:00Z',
    ativos,
  };
}

function instancia() {
  const el = new CarteiraCabecalho();
  // stub render para não precisar do DOM real
  el.render = function () { this.innerHTML = this.template(); };
  el.querySelector = () => null;
  return el;
}

// --- casos ---

caso('setCarteira calcula patrimonio ponderado correto', () => {
  const ativos = [
    { simbolo: 'PETR4', dataEntrada: '2026-01-01', capital: 1000, retorno: 0.1 },
    { simbolo: 'VALE3', dataEntrada: '2026-01-01', capital: 2000, retorno: -0.05 },
  ];
  // 1000 * 1.1 + 2000 * 0.95 = 1100 + 1900 = 3000
  assert.equal(calcularPatrimonio(ativos), 3000);
});

caso('setCarteira calcula retorno medio ponderado', () => {
  const ativos = [
    { simbolo: 'PETR4', dataEntrada: '2026-01-01', capital: 1000, retorno: 0.1 },
    { simbolo: 'VALE3', dataEntrada: '2026-01-01', capital: 2000, retorno: -0.05 },
  ];
  // (1000*0.1 + 2000*(-0.05)) / 3000 = (100 - 100) / 3000 = 0
  assert.equal(calcularRetornoMedioPonderado(ativos), 0);
});

caso('setCarteira renderiza nome da carteira no innerHTML', () => {
  const el = instancia();
  const carteira = novaCarteira([
    { simbolo: 'ITUB4', dataEntrada: '2026-01-01', capital: 5000, retorno: 0.08 },
  ]);
  el.setCarteira(carteira);
  assert.ok(el.innerHTML.includes('Carteira Teste'), `innerHTML deveria conter "Carteira Teste"; got: ${el.innerHTML.slice(0, 200)}`);
});

caso('retorno null tratado como zero no patrimonio', () => {
  const ativos = [
    { simbolo: 'BBAS3', dataEntrada: '2026-01-01', capital: 2000, retorno: null },
  ];
  // 2000 * (1 + 0) = 2000
  assert.equal(calcularPatrimonio(ativos), 2000);
});

console.log(`\n  ${casos} casos passaram.`);
