// Evolucao base 100: carteira x CDI x proxy (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';
import {
  diferencaPp, fatiarERebasear, indiceCdi, indiceDePrecos, inicioDoPeriodo, montarEvolucao, retornoFinal, serieCarteira, valorNaData,
} from '../public/js/analise/carteiraEvolucao.js';

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }
const op = (id, tipo, simbolo, dia, quantidade, precoUnitario) => ({ id, tipo, simbolo, executadaEm: `${dia}T10:00:00`, quantidade, precoUnitario });
const s = (...pares) => pares.map(([dataIso, preco]) => ({ dataIso, preco }));
const perto = (a, b, m = '') => assert.ok(Math.abs(a - b) < 1e-6, `${m} ${a} != ${b}`);

caso('base 100 na primeira compra e acompanha o preco', () => {
  const r = serieCarteira([op('1', 'COMPRA', 'A1', '2026-01-02', 10, 10)], { A1: s(['2026-01-02', 10], ['2026-01-05', 11], ['2026-01-06', 12]) });
  assert.deepEqual(r.map((p) => Math.round(p.valor)), [100, 110, 120]);
});

caso('data sem pregao carrega o ultimo preco (valorNaData)', () => {
  const serie = s(['2026-01-02', 10], ['2026-01-06', 12]);
  assert.equal(valorNaData(serie, '2026-01-04'), 10);
  assert.equal(valorNaData(serie, '2026-01-01'), null);
});

caso('ticker adicionado no meio do periodo nao vira lucro (aporte e fluxo)', () => {
  const ops = [op('1', 'COMPRA', 'A1', '2026-01-02', 10, 10), op('2', 'COMPRA', 'B1', '2026-01-05', 100, 10)];
  const r = serieCarteira(ops, { A1: s(['2026-01-02', 10], ['2026-01-05', 10], ['2026-01-06', 10]), B1: s(['2026-01-05', 10], ['2026-01-06', 11]) });
  perto(r[1].valor, 100, 'dia do aporte');
  perto(r[2].valor, (100 * 1200) / 1100, 'dia seguinte');
  assert.ok(r[2].patrimonio > r[1].patrimonio);
});

caso('ticker sem preco ate a data pula o dia em vez de inventar', () => {
  const ops = [op('1', 'COMPRA', 'A1', '2026-01-02', 10, 10), op('2', 'COMPRA', 'B1', '2026-01-02', 10, 10)];
  const r = serieCarteira(ops, { A1: s(['2026-01-02', 10], ['2026-01-05', 10]), B1: s(['2026-01-05', 10]) });
  assert.deepEqual(r.map((p) => p.dataIso), ['2026-01-05']);
});

caso('venda total: o indice se mantem sem posicao; recompra continua a serie', () => {
  const ops = [op('1', 'COMPRA', 'A1', '2026-01-02', 10, 10), op('2', 'VENDA', 'A1', '2026-01-05', 10, 12), op('3', 'COMPRA', 'A1', '2026-01-07', 10, 12)];
  const r = serieCarteira(ops, { A1: s(['2026-01-02', 10], ['2026-01-05', 12], ['2026-01-06', 12], ['2026-01-07', 13]) });
  perto(r[1].valor, 120, 'dia da venda');
  perto(r[2].valor, 120, 'sem posicao');
  assert.equal(r[2].patrimonio, 0);
  assert.ok(r[3].valor >= 120 - 1e-9);
});

caso('rebase 100 e recorte por periodo', () => {
  const r = fatiarERebasear([{ dataIso: 'a1', valor: 100 }, { dataIso: 'b2', valor: 120 }, { dataIso: 'c3', valor: 150 }], 'b2');
  assert.deepEqual(r.map((p) => Math.round(p.valor)), [100, 125]);
  assert.equal(inicioDoPeriodo('3m', '2026-01-01', '2026-10-21'), '2026-07-21');
  assert.equal(inicioDoPeriodo('12m', '2026-05-01', '2026-10-21'), '2026-05-01');
  assert.equal(inicioDoPeriodo('entrada', '2026-05-01', '2026-10-21'), '2026-05-01');
});

caso('CDI capitaliza os dias apos o inicio (% ao dia)', () => {
  const pts = [{ data: '2026-01-02', valor: 1 }, { data: '2026-01-05', valor: 1 }, { data: '2026-01-06', valor: 1 }];
  const r = indiceCdi(pts, ['2026-01-02', '2026-01-05', '2026-01-06']);
  perto(r[0].valor, 100);
  perto(r[2].valor, 100 * 1.01 * 1.01);
});

caso('proxy de indice rebaseado; diferenca em p.p.', () => {
  const r = indiceDePrecos(s(['2026-01-02', 100], ['2026-01-06', 110]), ['2026-01-02', '2026-01-05', '2026-01-06']);
  assert.deepEqual(r.map((p) => Math.round(p.valor)), [100, 100, 110]);
  perto(retornoFinal(r), 0.1);
  perto(diferencaPp(0.12, 0.1), 2);
  assert.equal(diferencaPp(null, 0.1), null);
});

caso('montarEvolucao: sem dados suficientes e com tudo', () => {
  assert.equal(montarEvolucao({ operacoes: [], seriesPrecos: {}, cdi: [] }).suficiente, false);
  const ops = [op('1', 'COMPRA', 'A1', '2026-01-02', 10, 10)];
  const e = montarEvolucao({
    operacoes: ops, seriesPrecos: { A1: s(['2026-01-02', 10], ['2026-01-05', 11]) },
    cdi: [{ data: '2026-01-05', valor: 0.05 }], proxyIbov: s(['2026-01-02', 100], ['2026-01-05', 101]), periodo: 'entrada', hoje: '2026-01-10',
  });
  assert.equal(e.suficiente, true);
  perto(e.retornos.carteira, 0.1);
  perto(e.diferencaCdiPp, 10 - 0.05);
  perto(e.retornos.ibov, 0.01);
  const semProxy = montarEvolucao({ operacoes: ops, seriesPrecos: { A1: s(['2026-01-02', 10], ['2026-01-05', 11]) }, cdi: null });
  assert.equal(semProxy.ibov.length, 0);
  assert.equal(semProxy.retornos.cdi, null);
});

console.log(`\n  ${casos} caso(s) passaram.`);
