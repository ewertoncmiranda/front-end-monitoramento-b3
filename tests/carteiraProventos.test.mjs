// Proventos recebidos x estimados (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';
import { deduplicarProventos, estimarProventosAtivo, proventosPorAtivo, quantidadeNaData, totaisProventos } from '../public/js/analise/carteiraProventos.js';

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }
const op = (id, tipo, dia, quantidade, simbolo = 'PETR4') => ({ id, tipo, simbolo, executadaEm: `${dia}T10:00:00`, quantidade, precoUnitario: 10 });
const prov = (com, valor, pag = '2026-12-01') => ({ tipo: 'DIVIDENDO', valorPorAcao: valor, ultimaDataComDireito: com, dataPagamento: pag });
const HOJE = '2026-10-21';

caso('compra depois da data com nao recebe', () => {
  assert.equal(estimarProventosAtivo([op('1', 'COMPRA', '2026-08-22', 100)], 'PETR4', [prov('2026-08-21', 0.5)], HOJE), null);
});

caso('compra na propria data com recebe', () => {
  assert.equal(estimarProventosAtivo([op('1', 'COMPRA', '2026-08-21', 100)], 'PETR4', [prov('2026-08-21', 0.5)], HOJE).total, 50);
});

caso('venda antes da data com nao recebe; venda parcial recebe o restante', () => {
  const ops = [op('1', 'COMPRA', '2026-01-01', 100), op('2', 'VENDA', '2026-03-01', 100)];
  assert.equal(estimarProventosAtivo(ops, 'PETR4', [prov('2026-05-01', 1)], HOJE), null);
  const parcial = [op('1', 'COMPRA', '2026-01-01', 100), op('2', 'VENDA', '2026-03-01', 40)];
  assert.equal(estimarProventosAtivo(parcial, 'PETR4', [prov('2026-05-01', 1)], HOJE).total, 60);
});

caso('quantidade varia ao longo do tempo: cada evento usa a quantidade da sua data com', () => {
  const ops = [op('1', 'COMPRA', '2026-01-01', 100), op('2', 'COMPRA', '2026-06-01', 100)];
  const r = estimarProventosAtivo(ops, 'PETR4', [prov('2026-03-01', 1), prov('2026-08-01', 1)], HOJE);
  assert.equal(r.total, 300);
  assert.equal(r.eventos, 2);
  assert.equal(quantidadeNaData(ops, 'PETR4', '2026-05-31'), 100);
});

caso('evento anterior a entrada e eventos duplicados do gestor nao contam', () => {
  const ops = [op('1', 'COMPRA', '2026-05-01', 100)];
  const lista = [prov('2026-03-01', 1), prov('2026-06-01', 1), prov('2026-06-01', 1)];
  assert.equal(deduplicarProventos(lista).length, 2);
  assert.equal(estimarProventosAtivo(ops, 'PETR4', lista, HOJE).total, 100);
});

caso('data com futura nao entra; pagamento futuro conta como a receber', () => {
  const ops = [op('1', 'COMPRA', '2026-01-01', 10)];
  const r = estimarProventosAtivo(ops, 'PETR4', [prov('2026-12-01', 1), prov('2026-10-01', 1, '2026-11-01')], HOJE);
  assert.equal(r.total, 10);
  assert.equal(r.aReceber, 1);
});

caso('recebido do gestor vence a estimativa e nunca se soma com ela; yield on cost', () => {
  const ops = [op('1', 'COMPRA', '2026-01-01', 100), op('2', 'COMPRA', '2026-01-01', 10, 'VALE3')];
  const mapa = proventosPorAtivo({
    recebidos: [{ simbolo: 'PETR4', valorLiquido: 80 }],
    operacoes: ops,
    proventosPorSimbolo: { PETR4: [prov('2026-05-01', 1)], VALE3: [prov('2026-05-01', 2)] },
    custos: { PETR4: 1000, VALE3: 100 },
    hoje: HOJE,
  });
  assert.deepEqual([mapa.get('PETR4').tipo, mapa.get('PETR4').total, mapa.get('PETR4').yieldOnCost], ['recebido', 80, 0.08]);
  assert.deepEqual([mapa.get('VALE3').tipo, mapa.get('VALE3').total], ['estimado', 20]);
  assert.deepEqual(totaisProventos(mapa), { recebido: 80, estimado: 20 });
});

console.log(`\n  ${casos} caso(s) passaram.`);
