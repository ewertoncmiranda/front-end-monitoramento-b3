// F360-PAI-1: FichaContexto (C2) e mapa de rotas de cada chave.
import assert from 'node:assert/strict';

const { FichaContexto } = await import('../../public/js/components/ficha360/FichaContexto.js');
const { rotaDaChave, buscarChave, CHAVES_DO_CONTEXTO } = await import('../../public/js/api/ficha360Api.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const hoje = new Date(Date.UTC(2026, 9, 14));

await caso('todas as chaves do contrato C2 tem rota', () => {
  for (const chave of ['ativo', 'analise', 'fundamentosCvm', 'fundamentosHistorico', 'identidade', 'opiniao',
    'fatores', 'proventos', 'composicao', 'comunicados', 'noticias', 'opcoes', 'operacional', 'backtest',
    'diario', 'pregoes', 'base']) {
    assert.ok(CHAVES_DO_CONTEXTO.includes(chave), chave);
  }
});

await caso('rotas com simbolo escapado e janelas de um ano', () => {
  assert.equal(rotaDaChave('fundamentosCvm', 'PETR4', hoje), '/analises/PETR4/fundamentos-cvm');
  assert.equal(rotaDaChave('pregoes', 'PETR4', hoje), '/ativos/PETR4/pregoes?intervalo=dia&de=2025-10-14');
  assert.equal(rotaDaChave('comunicados', 'VALE3', hoje), '/empresas/VALE3/comunicados?desde=2025-10-14');
  assert.equal(rotaDaChave('identidade', 'A/B', hoje), '/ativos/A%2FB/identidade');
  assert.equal(rotaDaChave('backtest', 'PETR4', hoje), '/validacao/backtest');
  assert.equal(rotaDaChave('inexistente', 'PETR4', hoje), null);
});

await caso('base devolve so a linha do simbolo exato', async () => {
  const get = async () => ({ content: [{ simbolo: 'PETR3' }, { simbolo: 'PETR4', setor: 'Petróleo' }] });
  assert.deepEqual(await buscarChave('base', 'petr4', hoje, get), { simbolo: 'PETR4', setor: 'Petróleo' });
  assert.equal(await buscarChave('base', 'PETR9', hoje, async () => ({ content: [] })), null);
});

await caso('cache: duas secoes pedindo a mesma chave geram uma requisicao', async () => {
  const pedidos = [];
  const ctx = new FichaContexto('petr4', async (chave, simbolo) => { pedidos.push(`${chave}:${simbolo}`); return { ok: 1 }; });
  const [a, b] = await Promise.all([ctx.obter('analise'), ctx.obter('analise')]);
  await ctx.obter('pregoes');
  assert.equal(ctx.simbolo, 'PETR4');
  assert.deepEqual(a, { ok: 1 });
  assert.equal(a, b);
  assert.deepEqual(pedidos, ['analise:PETR4', 'pregoes:PETR4']);
});

await caso('erro ou 404 resolve null, sem rejeitar e sem repetir a chamada', async () => {
  let chamadas = 0;
  const ctx = new FichaContexto('PETR4', async () => { chamadas++; throw new Error('HTTP 404'); });
  assert.equal(await ctx.obter('identidade'), null);
  assert.equal(await ctx.obter('identidade'), null);
  assert.equal(chamadas, 1);
});

await caso('falha sincrona do buscador tambem vira null', async () => {
  const ctx = new FichaContexto('PETR4', () => { throw new Error('boom'); });
  assert.equal(await ctx.obter('analise'), null);
});

await caso('undefined vira null (nunca zero nem objeto vazio)', async () => {
  const ctx = new FichaContexto('PETR4', async () => undefined);
  assert.equal(await ctx.obter('ativo'), null);
});

console.log(`contexto: ${casos} casos`);
