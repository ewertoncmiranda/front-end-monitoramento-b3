// Posicao derivada das operacoes (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';
import {
  alocacao, avaliarPosicao, comParticipacao, converterCapitalEmQuantidade, derivarPosicoes, filtrarPosicoes,
  ordenarPosicoes, posicaoLegada, posicoesAbertas, resumirCarteira, totalEstimado,
} from '../public/js/analise/carteiraPosicao.js';

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }
const op = (id, tipo, simbolo, dia, quantidade, precoUnitario, extra = {}) => ({ id, tipo, simbolo, executadaEm: `${dia}T10:00:00`, quantidade, precoUnitario, ...extra });

caso('compras multiplas: quantidade somada, preco medio ponderado, entrada = primeira compra', () => {
  const [p] = derivarPosicoes([op('2', 'COMPRA', 'PETR4', '2026-02-01', 100, 40), op('1', 'COMPRA', 'PETR4', '2026-01-10', 100, 30)]);
  assert.equal(p.quantidade, 200);
  assert.equal(p.precoMedio, 35);
  assert.equal(p.dataEntrada, '2026-01-10');
});

caso('custos entram no preco medio', () => {
  const [p] = derivarPosicoes([op('1', 'COMPRA', 'PETR4', '2026-01-10', 100, 30, { custos: 10 })]);
  assert.equal(p.precoMedio, 30.1);
});

caso('venda parcial baixa pelo custo medio e realiza resultado', () => {
  const [p] = derivarPosicoes([op('1', 'COMPRA', 'VALE3', '2026-01-01', 100, 10), op('2', 'VENDA', 'VALE3', '2026-02-01', 40, 15)]);
  assert.equal(p.quantidade, 60);
  assert.equal(p.precoMedio, 10);
  assert.equal(p.resultadoRealizado, 200);
});

caso('venda total zera a posicao e ela some das abertas', () => {
  const ops = [op('1', 'COMPRA', 'VALE3', '2026-01-01', 10, 10), op('2', 'VENDA', 'VALE3', '2026-02-01', 10, 12)];
  const [p] = derivarPosicoes(ops);
  assert.equal(p.quantidade, 0);
  assert.equal(p.dataEntrada, null);
  assert.equal(posicoesAbertas(ops).length, 0);
});

caso('recompra apos zerar abre nova entrada', () => {
  const [p] = derivarPosicoes([op('1', 'COMPRA', 'A1', '2026-01-01', 10, 10), op('2', 'VENDA', 'A1', '2026-02-01', 10, 12), op('3', 'COMPRA', 'A1', '2026-03-01', 5, 20)]);
  assert.equal(p.dataEntrada, '2026-03-01');
  assert.equal(p.precoMedio, 20);
});

caso('operacao estornada (e o estorno) saem do calculo', () => {
  const ops = [op('1', 'COMPRA', 'PETR4', '2026-01-01', 100, 30), op('2', 'COMPRA', 'PETR4', '2026-01-05', 50, 40),
    { id: '3', tipo: 'ESTORNO', operacaoReferenciadaId: '2', simbolo: 'PETR4', executadaEm: '2026-01-06T10:00:00', quantidade: 50, precoUnitario: 40 }];
  const [p] = derivarPosicoes(ops);
  assert.equal(p.quantidade, 100);
  assert.equal(p.precoMedio, 30);
});

caso('preco ausente: valor, resultado e % ficam null, nunca 0', () => {
  const [pos] = derivarPosicoes([op('1', 'COMPRA', 'PETR4', '2026-01-01', 100, 30)]);
  const a = avaliarPosicao(pos, { preco: null });
  assert.equal(a.valorAtual, null);
  assert.equal(a.resultado, null);
  assert.equal(a.resultadoPct, null);
  const r = resumirCarteira([a]);
  assert.equal(r.valorAtual, null);
  assert.equal(r.semPreco, 1);
});

caso('avaliacao: valorizacao em R$ e %', () => {
  const [pos] = derivarPosicoes([op('1', 'COMPRA', 'PETR4', '2026-01-01', 100, 30)]);
  const a = avaliarPosicao(pos, { preco: 33, dataPreco: '2026-10-20', hoje: '2026-01-11' });
  assert.equal(a.valorAtual, 3300);
  assert.equal(a.resultado, 300);
  assert.ok(Math.abs(a.resultadoPct - 0.1) < 1e-9);
  assert.equal(a.dias, 10);
});

const mk = (simbolo, custo, preco, qtd, extra = {}) => avaliarPosicao({ simbolo, quantidade: qtd, custoTotal: custo, dataEntrada: extra.entrada ?? '2026-01-01' }, { preco, dataPreco: '2026-10-20', setor: extra.setor });

caso('resumo, participacao, melhor e pior, proventos rotulados', () => {
  const lista = comParticipacao([mk('A1', 1000, 12, 100), mk('B1', 1000, 8, 100)]);
  assert.equal(Math.round(lista[0].participacao * 100), 60);
  const r = resumirCarteira(lista, { proventosRecebidos: 100, proventosEstimados: 50 });
  assert.equal(r.investido, 2000);
  assert.equal(r.valorAtual, 2000);
  assert.equal(r.resultado, 0);
  assert.equal(r.melhor.simbolo, 'A1');
  assert.equal(r.pior.simbolo, 'B1');
  assert.equal(r.dataUltimoPreco, '2026-10-20');
  assert.equal(r.retornoTotal, 0.05);
  assert.equal(r.retornoTotalComEstimados, 0.075);
});

caso('ordenacao: alta, queda, posicao, ticker, entrada; sem preco por ultimo', () => {
  const l = comParticipacao([mk('B1', 100, 12, 10, { entrada: '2026-03-01' }), mk('A1', 100, 8, 10, { entrada: '2026-01-01' }), mk('C1', 100, null, 10)]);
  const ord = (c) => ordenarPosicoes(l, c).map((p) => p.simbolo).join();
  assert.equal(ord('maior-alta'), 'B1,A1,C1');
  assert.equal(ord('maior-queda'), 'A1,B1,C1');
  assert.equal(ord('maior-posicao'), 'B1,A1,C1');
  assert.equal(ord('ticker'), 'A1,B1,C1');
  assert.equal(ord('data-entrada'), 'A1,C1,B1');
  assert.equal(l[0].simbolo, 'B1', 'nao muta a lista original');
});

caso('filtro por texto no ticker e setor, sem acento', () => {
  const l = [mk('PETR4', 1, 1, 1, { setor: 'Petróleo e Gás' }), mk('VALE3', 1, 1, 1, { setor: 'Mineração' })];
  assert.deepEqual(filtrarPosicoes(l, 'petr').map((p) => p.simbolo), ['PETR4']);
  assert.deepEqual(filtrarPosicoes(l, 'mineracao').map((p) => p.simbolo), ['VALE3']);
  assert.equal(filtrarPosicoes(l, '').length, 2);
});

caso('legado: marcado, sem quantidade; resultado so com preco de entrada; conversao inteira', () => {
  const l = posicaoLegada({ simbolo: 'bbas3', capital: 1000, dataEntrada: '2026-01-01' }, { preco: 12, precoEntrada: 10 });
  assert.equal(l.legado, true);
  assert.equal(l.quantidade, null);
  assert.equal(l.resultado, 200);
  assert.equal(posicaoLegada({ simbolo: 'X', capital: 10 }, {}).resultadoPct, null);
  assert.deepEqual(converterCapitalEmQuantidade(1000, 30), { quantidade: 33, precoUnitario: 30, sobra: 10 });
  assert.equal(converterCapitalEmQuantidade(10, 30), null);
  assert.equal(converterCapitalEmQuantidade(1000, null), null);
});

caso('alocacao por ativo e por setor com concentracao', () => {
  const l = [mk('A1', 1, 70, 1, { setor: 'S1' }), mk('B1', 1, 20, 1, { setor: 'S1' }), mk('C1', 1, 10, 1)];
  const porAtivo = alocacao(l, 'ativo');
  assert.equal(porAtivo[0].rotulo, 'A1');
  assert.equal(porAtivo[0].concentrado, true);
  assert.equal(porAtivo[1].concentrado, false);
  assert.deepEqual(alocacao(l, 'setor').map((g) => g.rotulo), ['S1', 'Sem setor']);
});

caso('total estimado em tempo real', () => {
  assert.equal(totalEstimado(100, 30.5), 3050);
  assert.equal(totalEstimado(100, 30.5, 4.9), 3054.9);
  assert.equal(totalEstimado(0, 30), null);
  assert.equal(totalEstimado('', 30), null);
});

console.log(`\n  ${casos} caso(s) passaram.`);
