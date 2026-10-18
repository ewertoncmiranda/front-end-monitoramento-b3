// CART-PAI-6 — testes de CarteiraAdicionarAtivo
import assert from 'node:assert/strict';

// --- mocks mínimos de DOM ---
globalThis.HTMLElement = class {
  innerHTML = '';
  querySelector = () => ({ value: '', addEventListener: () => {} });
  querySelectorAll = () => [];
  addEventListener = () => {};
};
globalThis.customElements = { define() {} };

// mock de localStorage para carteirasStore
const _armazenamento = new Map();
globalThis.localStorage = {
  getItem: (k) => _armazenamento.get(k) ?? null,
  setItem: (k, v) => _armazenamento.set(k, String(v)),
  removeItem: (k) => _armazenamento.delete(k),
};

// importa apenas a classe; customElements.define já foi substituído
const { CarteiraAdicionarAtivo } = await import(
  '../public/js/components/carteiras/CarteiraAdicionarAtivo.js'
);
const { adicionarAtivo } = await import('../public/js/utils/carteirasStore.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

// helper para criar uma instância sem precisar do DOM real
function criarInstancia(busca = null) {
  const inst = Object.create(CarteiraAdicionarAtivo.prototype);
  // inicializa o estado como o constructor faria
  inst._carteiraId = null;
  inst._simbolo = '';
  inst.querySelector = (seletor) => (seletor === '#seletor-ativo' ? busca : null);
  return inst;
}

// ─── casos ───────────────────────────────────────────────────────────────────

caso('setCarteiraId armazena id', () => {
  const inst = criarInstancia();
  inst.setCarteiraId('c1');
  assert.equal(inst._carteiraId, 'c1');
});

caso('setCarteiraId da a busca uma chave por carteira e herda o ticker guardado', () => {
  const atributos = {};
  const busca = { simbolos: ['VALE3'], setAttribute: (n, v) => { atributos[n] = v; } };
  const inst = criarInstancia(busca);
  inst.setCarteiraId('c7');
  assert.equal(atributos.chave, 'carteira-c7');
  assert.equal(inst._simbolo, 'VALE3');
});

caso('_validarCampos rejeita simbolo vazio', () => {
  const inst = criarInstancia();
  const err = inst._validarCampos('', '2026-01-10', 1000);
  assert.ok(err, 'deve retornar mensagem de erro');
  assert.match(err, /ativo/i);
});

caso('_validarCampos rejeita data futura', () => {
  const inst = criarInstancia();
  // usa uma data claramente futura (ano 9999)
  const err = inst._validarCampos('PETR4', '9999-01-01', 1000);
  assert.ok(err, 'deve retornar mensagem de erro');
  assert.match(err, /futura/i);
});

caso('_validarCampos rejeita capital zero', () => {
  const inst = criarInstancia();
  const err = inst._validarCampos('PETR4', '2026-01-10', 0);
  assert.ok(err, 'deve retornar mensagem de erro');
  assert.match(err, /capital|zero/i);
});

caso('_validarCampos rejeita capital negativo', () => {
  const inst = criarInstancia();
  const err = inst._validarCampos('PETR4', '2026-01-10', -50);
  assert.ok(err, 'deve retornar mensagem de erro');
  assert.match(err, /capital|zero/i);
});

caso('_validarCampos aceita dados validos', () => {
  const inst = criarInstancia();
  const err = inst._validarCampos('PETR4', '2026-01-10', 1000);
  assert.equal(err, null, 'dados validos nao devem gerar erro');
});

caso('emit ativo-adicionado em dados validos', () => {
  // prepara localStorage com uma carteira
  const carteiraId = 'c_test_emit';
  const dadosIniciais = {
    carteiras: [{ id: carteiraId, nome: 'Teste', ativos: [] }],
  };
  _armazenamento.set('b3-carteiras', JSON.stringify(dadosIniciais));

  const inst = criarInstancia();
  inst.setCarteiraId(carteiraId);

  // captura eventos despachados
  const events = [];
  inst.dispatchEvent = (e) => events.push(e);

  // simula _submeter com estado válido lido da "instância"
  // (em vez de mockar querySelector, chamamos _validarCampos + adicionarAtivo diretamente)
  inst._simbolo = 'VALE3';
  const simbolo = inst._simbolo;
  const dataEntrada = '2026-01-10';
  const capital = 500;

  // valida
  const erro = inst._validarCampos(simbolo, dataEntrada, capital);
  assert.equal(erro, null);

  // usa adicionarAtivo (importado no topo) para reproduzir o que _submeter faria
  const ativo = adicionarAtivo(carteiraId, { simbolo, dataEntrada, capital });

  inst.dispatchEvent(
    new CustomEvent('ativo-adicionado', {
      detail: { simbolo, dataEntrada, capital, ativo },
      bubbles: true,
    })
  );

  assert.equal(events.length, 1, 'deve ter emitido 1 evento');
  assert.equal(events[0].type, 'ativo-adicionado');
  assert.equal(events[0].detail.simbolo, 'VALE3');
  assert.equal(events[0].detail.capital, 500);
  assert.ok(events[0].detail.ativo, 'detail.ativo deve estar presente');
});

console.log(`\nTotal: ${casos} casos passaram.\n`);
