import test from 'node:test';
import assert from 'node:assert/strict';
import { faixaMultiplo, modeloValuation } from '../../public/js/analise/ficha360/valuation.js';

test('valuation mantém nulos e calcula preço implícito pelo múltiplo setorial', () => {
  const v = modeloValuation({ lpa: 2, pl_setorial_mediana: 12, pl: 8, preco_referencia: 10 });
  assert.equal(v.precoImplicitoSetorial, 24);
  assert.equal(v.pl, 8);
  assert.equal(v.graham, null);
  assert.equal(modeloValuation({}).precoImplicitoSetorial, null);
});

test('faixas não classificam valores ausentes como zero', () => {
  assert.equal(faixaMultiplo(null, 'pl').rotulo, 'sem dado');
  assert.equal(faixaMultiplo(10, 'pl').rotulo, 'baixo');
  assert.equal(faixaMultiplo(-1, 'pl').rotulo, 'não significativo');
});
