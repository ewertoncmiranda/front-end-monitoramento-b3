// CART-PAI-3 — testes do CarteiraModal.
import assert from 'node:assert/strict';

// Mock de HTMLElement e customElements antes de importar qualquer componente
globalThis.HTMLElement = class {
  querySelector() { return null; }
  addEventListener() {}
};
globalThis.customElements = { define() {} };

// Mock de localStorage
const armazenamento = {};
globalThis.localStorage = {
  getItem: (k) => armazenamento[k] ?? null,
  setItem: (k, v) => { armazenamento[k] = v; },
  removeItem: (k) => { delete armazenamento[k]; },
};

// Gestor simulado: devolve a carteira enviada com o id gerado pelo servidor.
let statusGestor = 201;
globalThis.fetch = async (url, init = {}) => {
  const corpo = init.body ? JSON.parse(init.body) : {};
  const resposta = { id: 'srv-1', ...corpo, moedaBase: 'BRL', status: 'ATIVA', criadaEm: '2026-10-18T10:00:00', ativos: [] };
  return { ok: statusGestor < 300, status: statusGestor, text: async () => JSON.stringify(resposta) };
};

// Mock de window.bootstrap
globalThis.window = globalThis;
globalThis.bootstrap = {
  Modal: class {
    show() {}
    hide() {}
  },
};

const { CarteiraModal } = await import('../public/js/components/carteiras/CarteiraModal.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

function limpar() {
  delete armazenamento['b3-carteiras'];
}

// Cria uma instância simulando o DOM suficiente para o componente funcionar
function criarInstancia() {
  const campos = {
    '#carteira-nome': { value: '' },
    '#carteira-estrategia': { value: 'Fundamentalista' },
    '#carteira-cor': { value: '#0d6efd' },
    '#btn-cancelar-carteira': { addEventListener() {} },
    '#btn-confirmar-carteira': { addEventListener() {} },
    '.modal': {},
  };

  const instance = Object.create(CarteiraModal.prototype);
  instance._modo = 'nova';
  instance._id = null;
  instance._modal = null;

  instance.querySelector = (sel) => campos[sel] ?? null;
  instance.dispatchEvent = () => {};
  instance._campoNome = () => campos['#carteira-nome'];
  instance._campoEstrategia = () => campos['#carteira-estrategia'];
  instance._campoCor = () => campos['#carteira-cor'];

  // Sobrescreve _mostrar para não depender de bootstrap.Modal real
  instance._mostrar = () => {
    if (!instance._modal) {
      instance._modal = new globalThis.bootstrap.Modal(campos['.modal']);
    }
    instance._modal.show();
  };

  return instance;
}

await caso('abrirNova limpa os campos', () => {
  limpar();
  const instance = criarInstancia();
  // Pre-popula com dados de edição para garantir que abrirNova limpa
  instance._modo = 'edicao';
  instance._id = 'c_antigo';
  instance._campoNome().value = 'Velha';
  instance._campoEstrategia().value = 'Graham';
  instance._campoCor().value = '#ff0000';

  instance.abrirNova();

  assert.equal(instance._modo, 'nova');
  assert.equal(instance._id, null);
  assert.equal(instance._campoNome().value, '');
  assert.equal(instance._campoEstrategia().value, 'Fundamentalista');
  assert.equal(instance._campoCor().value, '#0d6efd');
});

await caso('abrirEdicao popula os campos com a carteira', () => {
  limpar();
  const instance = criarInstancia();
  const carteira = { id: 'c1', nome: 'Test', estrategia: 'Graham', cor: '#ff0000', ativos: [] };

  instance.abrirEdicao(carteira);

  assert.equal(instance._modo, 'edicao');
  assert.equal(instance._id, 'c1');
  assert.equal(instance._campoNome().value, 'Test');
  assert.equal(instance._campoEstrategia().value, 'Graham');
  assert.equal(instance._campoCor().value, '#ff0000');
});

await caso('confirmar emite carteira-salva com carteira nova', async () => {
  limpar();
  const instance = criarInstancia();
  instance._modo = 'nova';
  instance._id = null;
  instance._campoNome().value = 'Minha Carteira';
  instance._campoEstrategia().value = 'Dividendos';
  instance._campoCor().value = '#123456';

  const events = [];
  instance.dispatchEvent = (e) => events.push(e);
  // fechar não deve lançar sem _modal
  instance.fechar = () => {};

  await instance._confirmar();

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'carteira-salva');
  assert.equal(events[0].detail.carteira.nome, 'Minha Carteira');
  assert.equal(events[0].detail.carteira.estrategia, 'Dividendos');
  assert.equal(events[0].detail.carteira.cor, '#123456');
  assert.equal(events[0].detail.carteira.id, 'srv-1', 'o id vem do gestor');
});

await caso('confirmar nao emite evento quando nome vazio', async () => {
  limpar();
  const instance = criarInstancia();
  instance._modo = 'nova';
  instance._campoNome().value = '';

  const events = [];
  instance.dispatchEvent = (e) => events.push(e);

  await instance._confirmar();

  assert.equal(events.length, 0);
});

await caso('falha ao salvar: modal fica aberto, mostra o erro e nao emite evento', async () => {
  statusGestor = 400;
  const instance = criarInstancia();
  const alerta = { textContent: '', classList: { toggle(classe, ligar) { this.oculto = ligar; } } };
  const original = instance.querySelector;
  instance.querySelector = (sel) => (sel === '[data-erro-carteira]' ? alerta : original(sel));
  instance._campoNome().value = 'Carteira X';
  let fechou = false;
  instance.fechar = () => { fechou = true; };
  const events = [];
  instance.dispatchEvent = (e) => events.push(e);

  await instance._confirmar();

  assert.equal(events.length, 0);
  assert.equal(fechou, false);
  assert.match(alerta.textContent, /recusou os dados/);
  assert.equal(alerta.classList.oculto, false);
  assert.equal(instance._campoNome().value, 'Carteira X', 'o que foi digitado continua no campo');
  statusGestor = 201;
});

await caso('fechar nao emite evento', () => {
  limpar();
  const instance = criarInstancia();
  const events = [];
  instance.dispatchEvent = (e) => events.push(e);

  // sem _modal instanciado, fechar não deve fazer nada nem lançar
  instance.fechar();

  assert.equal(events.length, 0);
});

console.log(`carteirasModal.test.mjs ok (${casos} casos)`);
