// CARTDB-PAI-1 — copia antiga das carteiras no navegador: so leitura e limpeza.
import assert from 'node:assert/strict';

const armazenamento = {};
globalThis.localStorage = {
  getItem: (k) => armazenamento[k] ?? null,
  setItem: (k, v) => { armazenamento[k] = v; },
  removeItem: (k) => { delete armazenamento[k]; },
};

const { listarCarteiras, limparCarteirasLocais } = await import('../public/js/utils/carteirasStore.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

caso('sem nada guardado: lista vazia', () => {
  delete armazenamento['b3-carteiras'];
  assert.deepEqual(listarCarteiras(), []);
});

caso('le as carteiras guardadas pelo painel antigo', () => {
  armazenamento['b3-carteiras'] = JSON.stringify({ carteiras: [{ id: 'c_1', nome: 'A', ativos: [] }] });
  assert.deepEqual(listarCarteiras().map((c) => c.id), ['c_1']);
});

caso('JSON corrompido ou formato estranho nao quebra: lista vazia', () => {
  armazenamento['b3-carteiras'] = '{quebrado';
  assert.deepEqual(listarCarteiras(), []);
  armazenamento['b3-carteiras'] = JSON.stringify({ carteiras: 'x' });
  assert.deepEqual(listarCarteiras(), []);
});

caso('limpar apaga a copia local', () => {
  armazenamento['b3-carteiras'] = JSON.stringify({ carteiras: [{ id: 'c_1' }] });
  limparCarteirasLocais();
  assert.equal(armazenamento['b3-carteiras'], undefined);
  assert.deepEqual(listarCarteiras(), []);
});

console.log(`carteirasStore.test.mjs ok (${casos} casos)`);
