/**
 * F360-PAI-3: Testes do plano de operação
 */

import { montarPlano } from '../../public/js/analise/ficha360/planoDeOperacao.js';

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nEsperado: ${JSON.stringify(expected)}\nRecebido: ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Gerar 30 pregões de teste
function gerarPregoes(preco = 100, volatilidade = 2) {
  const pregoes = [];
  for (let i = 0; i < 30; i++) {
    const variacao = (Math.random() - 0.5) * volatilidade;
    const max = preco + variacao + 1;
    const min = preco + variacao - 1;
    const fechamento = preco + variacao;
    pregoes.push({ max, min, fechamento });
    preco = fechamento;
  }
  return pregoes;
}

console.log('Testando plano de operação...');

// Teste 1: COMPRAR válido
console.log('Teste 1: COMPRAR válido...');
const planoCompra = montarPlano({
  analise: {
    recomendacao: 'COMPRA_FORTE',
    preco_atual: 100,
    valor_justo: 120,
  },
  fundamentosCvm: {
    graham_number: 110,
    lpa: 10,
    pl_setorial_mediana: 12,
  },
  pregoes: gerarPregoes(100),
  backtest: { taxa_acerto: 0.65 },
  opiniao: { horizonte: 'Médio prazo' },
});

assertEqual(planoCompra.acao, 'COMPRAR', 'Ação deve ser COMPRAR');
assertEqual(planoCompra.forca, 2, 'Força deve ser 2');
assert(planoCompra.entrada != null, 'Entrada não deve ser null');
assert(planoCompra.alvo != null, 'Alvo não deve ser null');
assert(planoCompra.stop != null, 'Stop não deve ser null');
assert(planoCompra.rr >= 1.5, 'R/R deve ser >= 1.5');
assertEqual(planoCompra.taxa_acerto, 0.65, 'Taxa de acerto deve ser 0.65');
console.log('✓ Teste 1 passou');

// Teste 2: VENDER válido
console.log('Teste 2: VENDER válido...');
const planoVenda = montarPlano({
  analise: {
    recomendacao: 'VENDA_VALUATION',
    preco_atual: 100,
    valor_justo: 80,
  },
  fundamentosCvm: {
    graham_number: 90,
    lpa: 10,
    pl_setorial_mediana: 8,
  },
  pregoes: gerarPregoes(100),
  backtest: { taxa_acerto: 0.55 },
  opiniao: { horizonte: 'Curto prazo' },
});

assertEqual(planoVenda.acao, 'VENDER', 'Ação deve ser VENDER');
assertEqual(planoVenda.forca, 1, 'Força deve ser 1');
assert(planoVenda.entrada != null, 'Entrada não deve ser null');
assert(planoVenda.alvo != null, 'Alvo não deve ser null');
assert(planoVenda.stop != null, 'Stop não deve ser null');
assert(planoVenda.rr >= 1.5, 'R/R deve ser >= 1.5');
console.log('✓ Teste 2 passou');

// Teste 3: R/R < 1,5 rebaixado para MANTER
console.log('Teste 3: R/R < 1,5 rebaixado para MANTER...');
const planoRrBaixo = montarPlano({
  analise: {
    recomendacao: 'COMPRA_MODERADA',
    preco_atual: 100,
    valor_justo: 102, // Alvo muito próximo
  },
  fundamentosCvm: {
    graham_number: 101,
    lpa: 10,
    pl_setorial_mediana: 10.2,
  },
  pregoes: gerarPregoes(100, 0.5), // Baixa volatilidade = ATR pequeno = R/R baixo
  backtest: null,
  opiniao: null,
});

assertEqual(planoRrBaixo.acao, 'MANTER', 'Ação deve ser MANTER quando R/R < 1.5');
assertEqual(planoRrBaixo.forca, 0, 'Força deve ser 0');
assert(planoRrBaixo.motivos.some(m => m.includes('R/R')), 'Deve ter motivo de R/R');
console.log('✓ Teste 3 passou');

// Teste 4: Alvo do lado errado
console.log('Teste 4: Alvo do lado errado...');
const planoAlvoErrado = montarPlano({
  analise: {
    recomendacao: 'COMPRA_FORTE',
    preco_atual: 100,
    valor_justo: 95, // Alvo abaixo do preço
  },
  fundamentosCvm: {
    graham_number: 94,
    lpa: 10,
    pl_setorial_mediana: 9.5,
  },
  pregoes: gerarPregoes(100),
  backtest: null,
  opiniao: null,
});

assertEqual(planoAlvoErrado.acao, 'MANTER', 'Ação deve ser MANTER quando alvo do lado errado');
assertEqual(planoAlvoErrado.forca, 0, 'Força deve ser 0');
assert(planoAlvoErrado.motivos.some(m => m.includes('Alvo')), 'Deve ter motivo de alvo');
console.log('✓ Teste 4 passou');

// Teste 5: Menos de 15 pregões
console.log('Teste 5: Menos de 15 pregões...');
const planoPoucosPregoes = montarPlano({
  analise: {
    recomendacao: 'COMPRA_FORTE',
    preco_atual: 100,
    valor_justo: 120,
  },
  fundamentosCvm: {
    graham_number: 110,
    lpa: 10,
    pl_setorial_mediana: 12,
  },
  pregoes: gerarPregoes(100).slice(0, 10), // Apenas 10 pregões
  backtest: null,
  opiniao: null,
});

assertEqual(planoPoucosPregoes.acao, 'MANTER', 'Ação deve ser MANTER com poucos pregões');
assertEqual(planoPoucosPregoes.forca, 0, 'Força deve ser 0');
assert(planoPoucosPregoes.entrada === null, 'Entrada deve ser null');
assert(planoPoucosPregoes.stop === null, 'Stop deve ser null');
assert(planoPoucosPregoes.rr === null, 'R/R deve ser null');
assert(planoPoucosPregoes.motivos.some(m => m.includes('pregões')), 'Deve ter motivo de pregões');
console.log('✓ Teste 5 passou');

// Teste 6: P/L setorial ausente
console.log('Teste 6: P/L setorial ausente...');
const planoPlAusente = montarPlano({
  analise: {
    recomendacao: 'COMPRA_FORTE',
    preco_atual: 100,
    valor_justo: 120,
  },
  fundamentosCvm: {
    graham_number: 110,
    lpa: 10,
    pl_setorial_mediana: null, // Ausente
  },
  pregoes: gerarPregoes(100),
  backtest: null,
  opiniao: null,
});

assertEqual(planoPlAusente.acao, 'COMPRAR', 'Ação deve ser COMPRAR');
assert(planoPlAusente.alvo != null, 'Alvo deve usar apenas Graham');
console.log('✓ Teste 6 passou');

// Teste 7: null preservado
console.log('Teste 7: null preservado...');
const planoNull = montarPlano({
  analise: null,
  fundamentosCvm: null,
  pregoes: null,
  backtest: null,
  opiniao: null,
});

assertEqual(planoNull.acao, 'MANTER', 'Ação deve ser MANTER com tudo null');
assertEqual(planoNull.forca, 0, 'Força deve ser 0');
assert(planoNull.entrada === null, 'Entrada deve ser null');
assert(planoNull.alvo === null, 'Alvo deve ser null');
assert(planoNull.stop === null, 'Stop deve ser null');
assert(planoNull.rr === null, 'R/R deve ser null');
assert(planoNull.taxa_acerto === null, 'Taxa de acerto deve ser null');
console.log('✓ Teste 7 passou');

// Teste 8: Preço atual indisponível
console.log('Teste 8: Preço atual indisponível...');
const planoSemPreco = montarPlano({
  analise: {
    recomendacao: 'COMPRA_FORTE',
    preco_atual: null,
  },
  fundamentosCvm: null,
  pregoes: gerarPregoes(100),
  backtest: null,
  opiniao: null,
});

assertEqual(planoSemPreco.acao, 'MANTER', 'Ação deve ser MANTER sem preço');
assert(planoSemPreco.motivos.some(m => m.includes('Preço')), 'Deve ter motivo de preço');
console.log('✓ Teste 8 passou');

console.log('\n✅ Todos os testes de plano de operação passaram!');
