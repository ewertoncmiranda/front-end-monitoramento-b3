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

// Gestor simulado: PUT /carteiras/{id}/ativos/{simbolo}
const chamadas = [];
let statusGestor = 200;
globalThis.fetch = async (url, init = {}) => {
  const corpo = init.body ? JSON.parse(init.body) : {};
  chamadas.push({ url, metodo: init.method, corpo });
  const simbolo = decodeURIComponent(url.split('/').pop());
  return {
    ok: statusGestor < 300,
    status: statusGestor,
    text: async () => JSON.stringify({ simbolo, dataEntrada: corpo.dataEntrada, capitalAlocado: corpo.capitalAlocado, naturezaCapital: 'ALOCACAO_SIMULADA_LEGADA' }),
  };
};

// importa apenas a classe; customElements.define já foi substituído
const { CarteiraAdicionarAtivo } = await import(
  '../public/js/components/carteiras/CarteiraAdicionarAtivo.js'
);

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

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

// Formulario simulado: campos, botao, busca e area de erro.
function instanciaComFormulario({ existentes = [] } = {}) {
  const campos = {
    '#data-entrada': { value: '2026-01-10' },
    '#capital': { value: '500' },
    '#btn-adicionar': { disabled: false },
    '#seletor-ativo': { limpar() { this.limpo = true; } },
    '#form-adicionar-ativo': { prepend(div) { this.erro = div.textContent; } },
  };
  const inst = Object.create(CarteiraAdicionarAtivo.prototype);
  inst._simbolo = 'VALE3';
  inst._carteiraId = 'c_test';
  inst._existentes = existentes;
  inst.querySelector = (sel) => campos[sel] ?? null;
  inst.eventos = [];
  inst.dispatchEvent = (e) => inst.eventos.push(e);
  return { inst, campos };
}
globalThis.CustomEvent = class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
globalThis.document = { createElement: () => ({ className: '', textContent: '' }) };
globalThis.window = { confirm: () => true };

await caso('submeter grava no gestor, limpa a busca e emite ativo-adicionado', async () => {
  chamadas.length = 0;
  const { inst, campos } = instanciaComFormulario();
  await inst._submeter();
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].metodo, 'PUT');
  assert.equal(chamadas[0].url, '/carteiras/c_test/ativos/VALE3');
  assert.deepEqual(chamadas[0].corpo, { dataEntrada: '2026-01-10', capitalAlocado: 500 });
  assert.equal(campos['#seletor-ativo'].limpo, true);
  assert.equal(inst.eventos[0].type, 'ativo-adicionado');
  assert.equal(inst.eventos[0].detail.ativo.capital, 500);
});

await caso('ticker ja na carteira: pede confirmacao; recusar nao grava', async () => {
  chamadas.length = 0;
  globalThis.window.confirm = () => false;
  const { inst } = instanciaComFormulario({ existentes: ['VALE3'] });
  await inst._submeter();
  assert.equal(chamadas.length, 0);
  assert.equal(inst.eventos.length, 0);
  globalThis.window.confirm = () => true;
});

await caso('gestor recusa: mostra o motivo, nao emite evento e reabilita o botao', async () => {
  statusGestor = 400;
  const { inst, campos } = instanciaComFormulario();
  await inst._submeter();
  assert.equal(inst.eventos.length, 0);
  assert.match(campos['#form-adicionar-ativo'].erro, /recusou os dados/);
  assert.equal(campos['#btn-adicionar'].disabled, false);
  statusGestor = 200;
});

console.log(`\nTotal: ${casos} casos passaram.\n`);
