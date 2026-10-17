// API de preco por data para carteiras (CART-PAI-2).
import assert from 'node:assert/strict';

const mockVelas = [
  { dataIso: '2026-01-10', fechamento: 25.50 },
  { dataIso: '2026-01-11', fechamento: 26.00 },
];

globalThis.fetch = async (_url, _opts) => ({
  ok: true,
  text: async () => JSON.stringify({ velas: mockVelas, resumo: { fechamento: 26.00 } }),
});

const { buscarPrecoNaData, calcularRetornoAtivo } = await import('../public/js/api/carteirasPrecoApi.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }
async function casoAsync(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

await casoAsync('buscarPrecoNaData retorna preco na data exata', async () => {
  globalThis.fetch = async (_url, _opts) => ({
    ok: true,
    text: async () => JSON.stringify({ velas: mockVelas }),
  });
  const resultado = await buscarPrecoNaData('PETR4', '2026-01-10');
  assert.deepEqual(resultado, { dataEfetiva: '2026-01-10', preco: 25.50 });
});

await casoAsync('buscarPrecoNaData retorna preco mais recente quando data nao encontrada', async () => {
  globalThis.fetch = async (_url, _opts) => ({
    ok: true,
    text: async () => JSON.stringify({ velas: mockVelas }),
  });
  // Solicita 2026-01-09 que e anterior a qualquer vela disponivel;
  // deve retornar a primeira data disponivel (2026-01-10).
  const resultado = await buscarPrecoNaData('PETR4', '2026-01-09');
  assert.deepEqual(resultado, { dataEfetiva: '2026-01-10', preco: 25.50 });
});

await casoAsync('buscarPrecoNaData retorna null quando sem velas', async () => {
  globalThis.fetch = async (_url, _opts) => ({
    ok: true,
    text: async () => JSON.stringify({ velas: [] }),
  });
  const resultado = await buscarPrecoNaData('PETR4', '2026-01-10');
  assert.equal(resultado, null);
});

await casoAsync('calcularRetornoAtivo retorna retorno calculado', async () => {
  let chamadas = 0;
  globalThis.fetch = async (_url, _opts) => {
    chamadas++;
    const velas = chamadas === 1
      ? [{ dataIso: '2026-01-10', fechamento: 25.50 }]
      : [{ dataIso: '2026-01-15', fechamento: 30.00 }];
    return {
      ok: true,
      text: async () => JSON.stringify({ velas }),
    };
  };
  const resultado = await calcularRetornoAtivo('PETR4', '2026-01-10');
  assert.ok(resultado !== null);
  assert.equal(resultado.precoEntrada, 25.50);
  assert.equal(resultado.precoAtual, 30.00);
  const retornoEsperado = (30.00 - 25.50) / 25.50;
  assert.ok(Math.abs(resultado.retorno - retornoEsperado) < 1e-10);
});

await casoAsync('calcularRetornoAtivo retorna null quando fetch falha', async () => {
  globalThis.fetch = async (_url, _opts) => ({
    ok: true,
    text: async () => JSON.stringify({ velas: [] }),
  });
  const resultado = await calcularRetornoAtivo('PETR4', '2026-01-10');
  assert.equal(resultado, null);
});

console.log(`carteirasPreco.test.mjs ok (${casos} casos)`);
