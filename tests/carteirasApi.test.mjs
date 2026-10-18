// CARTDB-PAI-1..2 — cliente da API de carteiras do gestor e preparo da importacao.
import assert from 'node:assert/strict';

const chamadas = [];
let proximaResposta = { status: 200, corpo: null };
globalThis.fetch = async (url, init = {}) => {
  chamadas.push({ url, metodo: init.method || 'GET', headers: init.headers || {}, corpo: init.body ? JSON.parse(init.body) : undefined });
  const { status, corpo } = proximaResposta;
  return { ok: status >= 200 && status < 300, status, text: async () => (corpo === null ? '' : JSON.stringify(corpo)) };
};

const api = await import('../public/js/api/carteirasApi.js');
const migracao = await import('../public/js/analise/carteirasMigracao.js');

let casos = 0;
async function caso(nome, fn) { chamadas.length = 0; await fn(); casos++; console.log(`  ok  ${nome}`); }
const responder = (status, corpo = null) => { proximaResposta = { status, corpo }; };

const dto = {
  id: 'c_1', nome: 'Dividendos', estrategia: 'Dividendos', cor: '#123456', moedaBase: 'BRL', status: 'ATIVA',
  criadaEm: '2026-10-01T10:00:00', ativos: [{ simbolo: 'TAEE11', dataEntrada: '2026-09-01', capitalAlocado: 1500.5, naturezaCapital: 'ALOCACAO_SIMULADA_LEGADA' }],
};

// --- API ---------------------------------------------------------------------------------
await caso('listar traduz capitalAlocado do gestor para capital do painel', async () => {
  responder(200, [dto]);
  const [c] = await api.listarCarteiras();
  assert.equal(chamadas[0].url, '/carteiras');
  assert.deepEqual(c.ativos[0], { simbolo: 'TAEE11', dataEntrada: '2026-09-01', capital: 1500.5, naturezaCapital: 'ALOCACAO_SIMULADA_LEGADA' });
  assert.equal(c.status, 'ATIVA');
});

await caso('criar e editar mandam JSON com Content-Type e so os campos da carteira', async () => {
  responder(201, dto);
  await api.criarCarteira({ nome: 'X', estrategia: 'Y', cor: '#fff', lixo: 1 });
  assert.equal(chamadas[0].metodo, 'POST');
  assert.equal(chamadas[0].headers['Content-Type'], 'application/json');
  assert.deepEqual(chamadas[0].corpo, { nome: 'X', estrategia: 'Y', cor: '#fff' });
  responder(200, dto);
  await api.atualizarCarteira('c 1/x', { nome: 'X', estrategia: 'Y', cor: '#fff' });
  assert.equal(chamadas[1].metodo, 'PUT');
  assert.equal(chamadas[1].url, '/carteiras/c%201%2Fx');
});

await caso('salvar ativo: PUT por ticker, capital arredondado em 2 casas', async () => {
  responder(200, dto.ativos[0]);
  await api.salvarAtivo('c_1', { simbolo: 'taee11', dataEntrada: '2026-09-01', capital: 1500.4999 });
  assert.equal(chamadas[0].metodo, 'PUT');
  assert.equal(chamadas[0].url, '/carteiras/c_1/ativos/TAEE11');
  assert.deepEqual(chamadas[0].corpo, { dataEntrada: '2026-09-01', capitalAlocado: 1500.5 });
});

await caso('remover carteira arquiva (DELETE) e importacao vai para /carteiras/importacoes', async () => {
  responder(204);
  await api.arquivarCarteira('c_1');
  assert.equal(chamadas[0].metodo, 'DELETE');
  responder(200, { importadas: 1, jaExistentes: 0, idsCarteira: { c_1: 'c_1' } });
  const r = await api.importarCarteiras({ carteiras: [] });
  assert.equal(chamadas[1].url, '/carteiras/importacoes');
  assert.equal(r.importadas, 1);
});

await caso('mensagens de erro pelo status (o gestor nao manda o motivo no corpo)', async () => {
  responder(409);
  await assert.rejects(api.importarCarteiras({ carteiras: [] }), (e) => /mesmo id e conteúdo diferente/.test(api.mensagemDeErro(e)));
  assert.match(api.mensagemDeErro({ status: 400 }), /recusou os dados/);
  assert.match(api.mensagemDeErro({ status: 503 }), /V42/);
  assert.match(api.mensagemDeErro({ status: 404 }), /não encontrou/);
});

// --- preparo da importacao ----------------------------------------------------------------
const agora = new Date('2026-10-18T16:00:00Z');

await caso('carteira local vira CarteiraLegada mantendo o id; padroes para estrategia e cor', async () => {
  const { payload, avisos } = migracao.prepararImportacao([
    { id: 'c_1', nome: ' Minha ', cor: 'azul', criadaEm: '2026-10-17T12:30:45.123Z', ativos: [] },
  ], agora);
  assert.deepEqual(payload.carteiras[0], {
    id: 'c_1', nome: 'Minha', estrategia: 'Sem estratégia', cor: '#0d6efd', criadaEm: '2026-10-17T12:30:45', ativos: [],
  });
  assert.deepEqual(avisos, []);
});

await caso('criadaEm sem fuso e sem milissegundos; invalida ou futura vira null', async () => {
  assert.equal(migracao.criadaEmParaGestor('2026-10-17T12:30:45.999Z', agora), '2026-10-17T12:30:45');
  assert.equal(migracao.criadaEmParaGestor('2027-01-01T00:00:00Z', agora), null);
  assert.equal(migracao.criadaEmParaGestor('ontem', agora), null);
  assert.equal(migracao.criadaEmParaGestor(undefined, agora), null);
});

await caso('ticker repetido: soma capital, mantem data mais antiga e avisa', async () => {
  const { payload, avisos } = migracao.prepararImportacao([{ id: 'c_1', nome: 'A', estrategia: 'G', cor: '#000', ativos: [
    { simbolo: 'petr4', dataEntrada: '2026-09-10', capital: 100.333 },
    { simbolo: 'PETR4', dataEntrada: '2026-09-01', capital: 200 },
    { simbolo: 'VALE3', dataEntrada: '2026-09-05', capital: 50 },
  ] }], agora);
  assert.deepEqual(payload.carteiras[0].ativos, [
    { simbolo: 'PETR4', dataEntrada: '2026-09-01', capital: 300.33 },
    { simbolo: 'VALE3', dataEntrada: '2026-09-05', capital: 50 },
  ]);
  assert.match(avisos[0], /A: PETR4 aparecia mais de uma vez/);
});

await caso('ativo incompleto fica de fora com aviso; carteira sem id e ignorada', async () => {
  const { payload, avisos } = migracao.prepararImportacao([
    { id: 'c_1', nome: 'A', estrategia: 'G', cor: '#000', ativos: [{ simbolo: 'PETR4', dataEntrada: '', capital: 10 }, { simbolo: 'X', dataEntrada: '2026-09-01', capital: 0 }] },
    { nome: 'sem id' },
  ], agora);
  assert.equal(payload.carteiras.length, 1);
  assert.deepEqual(payload.carteiras[0].ativos, []);
  assert.equal(avisos.length, 2);
});

await caso('mesmo conteudo gera o mesmo payload (o gestor reconhece o reenvio)', async () => {
  const locais = [{ id: 'c_1', nome: 'A', estrategia: 'G', cor: '#000', criadaEm: '2026-10-01T00:00:00Z',
    ativos: [{ simbolo: 'VALE3', dataEntrada: '2026-09-05', capital: 50 }, { simbolo: 'PETR4', dataEntrada: '2026-09-01', capital: 10 }] }];
  assert.deepEqual(migracao.prepararImportacao(locais, agora), migracao.prepararImportacao(locais, agora));
});

console.log(`carteirasApi: ${casos} casos`);
