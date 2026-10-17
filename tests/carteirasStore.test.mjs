// CART-PAI-1 — testes do store de carteiras em localStorage.
import assert from 'node:assert/strict';

// Mock de localStorage antes de importar o módulo
const armazenamento = {};
globalThis.localStorage = {
  getItem: (k) => armazenamento[k] ?? null,
  setItem: (k, v) => { armazenamento[k] = v; },
  removeItem: (k) => { delete armazenamento[k]; },
};

const {
  listarCarteiras,
  criarCarteira,
  atualizarCarteira,
  removerCarteira,
  adicionarAtivo,
  removerAtivo,
} = await import('../public/js/utils/carteirasStore.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

function limpar() {
  delete armazenamento['b3-carteiras'];
}

caso('listarCarteiras retorna [] quando storage vazio', () => {
  limpar();
  // Simula getItem retornando null (chave inexistente)
  const resultado = listarCarteiras();
  assert.deepEqual(resultado, []);
});

caso('criarCarteira persiste e retorna objeto com id', () => {
  limpar();
  const c = criarCarteira({ nome: 'Minha Carteira', estrategia: 'VALOR', cor: '#FF0000' });
  assert.ok(c.id.startsWith('c_'), 'id deve iniciar com c_');
  assert.equal(c.nome, 'Minha Carteira');
  assert.deepEqual(c.ativos, []);
  const lista = listarCarteiras();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].id, c.id);
});

caso('atualizarCarteira muda apenas os campos passados', () => {
  limpar();
  const c = criarCarteira({ nome: 'Original', estrategia: 'MOMENTO', cor: '#000' });
  const atualizada = atualizarCarteira(c.id, { nome: 'Novo Nome' });
  assert.equal(atualizada.nome, 'Novo Nome');
  assert.equal(atualizada.estrategia, 'MOMENTO');
  assert.equal(atualizada.cor, '#000');
  const buscada = listarCarteiras().find((x) => x.id === c.id);
  assert.equal(buscada.nome, 'Novo Nome');
});

caso('removerCarteira remove da lista', () => {
  limpar();
  const c1 = criarCarteira({ nome: 'A', estrategia: 'X', cor: '#111' });
  const c2 = criarCarteira({ nome: 'B', estrategia: 'Y', cor: '#222' });
  removerCarteira(c1.id);
  const lista = listarCarteiras();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].id, c2.id);
});

caso('adicionarAtivo adiciona ao array ativos', () => {
  limpar();
  const c = criarCarteira({ nome: 'Test', estrategia: 'Z', cor: '#333' });
  const ativo = adicionarAtivo(c.id, { simbolo: 'PETR4', dataEntrada: '2026-01-10', capital: 5000 });
  assert.equal(ativo.simbolo, 'PETR4');
  assert.equal(ativo.dataEntrada, '2026-01-10');
  assert.equal(ativo.capital, 5000);
  const carteira = listarCarteiras().find((x) => x.id === c.id);
  assert.equal(carteira.ativos.length, 1);
  assert.equal(carteira.ativos[0].simbolo, 'PETR4');
});

caso('removerAtivo remove do array ativos', () => {
  limpar();
  const c = criarCarteira({ nome: 'Test2', estrategia: 'Z', cor: '#444' });
  adicionarAtivo(c.id, { simbolo: 'VALE3', dataEntrada: '2026-02-01', capital: 3000 });
  adicionarAtivo(c.id, { simbolo: 'B3SA3', dataEntrada: '2026-02-05', capital: 2000 });
  removerAtivo(c.id, 'VALE3');
  const carteira = listarCarteiras().find((x) => x.id === c.id);
  assert.equal(carteira.ativos.length, 1);
  assert.equal(carteira.ativos[0].simbolo, 'B3SA3');
});

caso('localStorage indisponivel nao quebra', () => {
  // Substitui globalThis.localStorage por um que lança exceção
  const lsOriginal = globalThis.localStorage;
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  const resultado = listarCarteiras();
  assert.deepEqual(resultado, []);
  globalThis.localStorage = lsOriginal;
});

console.log(`carteirasStore.test.mjs ok (${casos} casos)`);
