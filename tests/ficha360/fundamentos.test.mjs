import test from 'node:test';
import assert from 'node:assert/strict';
import {
  METRICAS_FINANCEIRAS, METRICAS_FUNDAMENTOS, direcaoDaSerie, ehPlanoFinanceiro, itemAtual, metricasDoPlano, serieDaMetrica,
} from '../../public/js/analise/ficha360/seriesFundamentos.js';

test('séries são ascendentes conforme recebidas e derivam dívida líquida/EBITDA', () => {
  const pontos = [{ periodo: '2023-12-31', divida_liquida: 20, ebitda: 10 }, { periodo: '2024-12-31', divida_liquida: 15, ebitda: 10 }];
  assert.deepEqual(serieDaMetrica(pontos, 'divida_liquida_ebitda').map((p) => p.valor), [2, 1.5]);
  assert.equal(itemAtual({ divida_liquida: 12, ebitda: 4 }, pontos, 'divida_liquida_ebitda').valor, 3);
  assert.equal(direcaoDaSerie([{ valor: 2 }, { valor: 1 }]).direcao, 'em queda');
});

test('valor ou histórico ausentes não viram zero', () => {
  assert.equal(itemAtual({}, [], 'roe').valor, null);
  assert.deepEqual(serieDaMetrica([{ roe: null }], 'roe'), []);
});

test('banco e seguradora usam os indicadores do plano financeiro', () => {
  assert.equal(metricasDoPlano('FINANCEIRO'), METRICAS_FINANCEIRAS);
  assert.equal(metricasDoPlano('seguradora'), METRICAS_FINANCEIRAS);
  assert.equal(metricasDoPlano('GERAL'), METRICAS_FUNDAMENTOS);
  assert.equal(metricasDoPlano(undefined), METRICAS_FUNDAMENTOS);
  assert.equal(ehPlanoFinanceiro(null), false);
  const chaves = METRICAS_FINANCEIRAS.flatMap((g) => g.itens.map(([k]) => k));
  for (const naoSeAplica of ['ebitda', 'liquidez_corrente', 'liquidez_seca', 'dso', 'receita_liquida', 'roic', 'divida_liquida_ebitda', 'cobertura_juros']) {
    assert.ok(!chaves.includes(naoSeAplica), `${naoSeAplica} nao se aplica a banco`);
  }
  assert.equal(itemAtual({ preco_valor_patrimonial: 1.8 }, [], 'preco_valor_patrimonial').valor, 1.8);
});
