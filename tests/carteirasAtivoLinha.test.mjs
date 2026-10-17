// Linha de ativo com retorno calculado (CART-PAI-4).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class { innerHTML = ''; querySelector = () => null; };
globalThis.customElements = { define() {} };

// Mock fetch inicial (sobrescrito em cada caso)
globalThis.fetch = async (_url, _opts) => ({
  ok: true,
  text: async () => JSON.stringify({ velas: [] }),
});

const { CarteiraAtivoLinha } = await import('../public/js/components/carteiras/CarteiraAtivoLinha.js');

let casos = 0;
async function casoAsync(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

await casoAsync('setAtivo chama calcularRetornoAtivo e exibe retorno positivo', async () => {
  let chamadas = 0;
  globalThis.fetch = async (_url, _opts) => {
    chamadas++;
    // primeira chamada = data de entrada (preco 25.00), segunda = hoje (preco 27.50)
    const velas = chamadas === 1
      ? [{ dataIso: '2024-01-01', fechamento: 25.00 }]
      : [{ dataIso: '2026-10-17', fechamento: 27.50 }];
    return { ok: true, text: async () => JSON.stringify({ velas }) };
  };

  const linha = new CarteiraAtivoLinha();
  linha.setAtivo({ simbolo: 'PETR4', dataEntrada: '2024-01-01', capital: 1000 });
  await new Promise((r) => setTimeout(r, 0));

  assert.ok(
    linha.innerHTML.includes('▲') || linha.innerHTML.includes('text-success'),
    `Esperava ▲ ou text-success em: ${linha.innerHTML}`,
  );
});

await casoAsync('setAtivo exibe dash quando retorno e null', async () => {
  globalThis.fetch = async (_url, _opts) => ({
    ok: true,
    text: async () => JSON.stringify({ velas: [] }),
  });

  const linha = new CarteiraAtivoLinha();
  linha.setAtivo({ simbolo: 'VALE3', dataEntrada: '2024-06-01', capital: 2000 });
  await new Promise((r) => setTimeout(r, 0));

  assert.ok(
    linha.innerHTML.includes('—'),
    `Esperava — em: ${linha.innerHTML}`,
  );
});

await casoAsync('setAtivo exibe retorno negativo com badge vermelho', async () => {
  let chamadas = 0;
  globalThis.fetch = async (_url, _opts) => {
    chamadas++;
    // entrada mais cara que hoje -> retorno negativo
    const velas = chamadas === 1
      ? [{ dataIso: '2024-01-01', fechamento: 30.00 }]
      : [{ dataIso: '2026-10-17', fechamento: 25.00 }];
    return { ok: true, text: async () => JSON.stringify({ velas }) };
  };

  const linha = new CarteiraAtivoLinha();
  linha.setAtivo({ simbolo: 'BBAS3', dataEntrada: '2024-01-01', capital: 5000 });
  await new Promise((r) => setTimeout(r, 0));

  assert.ok(
    linha.innerHTML.includes('▼') || linha.innerHTML.includes('text-danger'),
    `Esperava ▼ ou text-danger em: ${linha.innerHTML}`,
  );
});

console.log(`carteirasAtivoLinha.test.mjs ok (${casos} casos)`);
