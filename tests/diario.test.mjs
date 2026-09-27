// Testes da leitura do diario de sinais (public/js/analise/diarioDeSinais.js).
// Node puro, mesmo estilo dos demais testes do painel.

import assert from 'node:assert/strict';
import {
  agruparPorPregao,
  estadoDoHorizonte,
  formatarPercentual,
  formatarTaxaComIc,
  leituraDoPlacar,
  wilson,
} from '../public/js/analise/diarioDeSinais.js';

let casos = 0;
function caso(nome, fn) {
  fn();
  casos++;
  console.log(`  ok  ${nome}`);
}

caso('linha do tempo agrupa por pregao, mais recente primeiro, ativos em ordem', () => {
  const blocos = agruparPorPregao([
    { dataPregao: '2026-09-28', simbolo: 'VALE3' },
    { dataPregao: '2026-09-29', simbolo: 'PETR4' },
    { dataPregao: '2026-09-28', simbolo: 'BBAS3' },
  ]);
  assert.deepEqual(blocos.map((b) => b.dataPregao), ['2026-09-29', '2026-09-28']);
  assert.deepEqual(blocos[1].sinais.map((s) => s.simbolo), ['BBAS3', 'VALE3']);
});

caso('horizonte sem resultado esta pendente', () => {
  assert.equal(estadoDoHorizonte({ resultados: {} }, 21).estado, 'pendente');
  assert.equal(estadoDoHorizonte({}, 21).estado, 'pendente');
});

caso('estado do horizonte segue acerto, erro, neutro e suspeito', () => {
  const sinal = {
    resultados: {
      21: { acerto: true, retornoLiquido: 0.03, eventoSuspeito: false },
      63: { acerto: false, retornoLiquido: -0.02, eventoSuspeito: false },
      126: { acerto: null, retornoLiquido: 0.01, eventoSuspeito: false },
    },
  };
  assert.equal(estadoDoHorizonte(sinal, 21).estado, 'acerto');
  assert.equal(estadoDoHorizonte(sinal, 63).estado, 'erro');
  assert.equal(estadoDoHorizonte(sinal, 126).estado, 'neutro');
  const suspeito = { resultados: { 21: { acerto: true, retornoLiquido: -0.5, eventoSuspeito: true } } };
  assert.equal(estadoDoHorizonte(suspeito, 21).estado, 'suspeito');
});

caso('amostra pequena nao ganha leitura, por melhor que pareca', () => {
  const leitura = leituraDoPlacar({ amostraSuficiente: false, taxaAcerto: 0.9, taxaBase: 0.5 });
  assert.equal(leitura.rotulo, 'Amostra insuficiente');
});

caso('acerto e lido contra a taxa-base, nao sozinho', () => {
  assert.equal(leituraDoPlacar({ amostraSuficiente: true, taxaAcerto: 0.65, taxaBase: 0.55 }).rotulo, 'Acima da base');
  assert.equal(leituraDoPlacar({ amostraSuficiente: true, taxaAcerto: 0.57, taxaBase: 0.55 }).rotulo, 'Igual à base');
  assert.equal(leituraDoPlacar({ amostraSuficiente: true, taxaAcerto: 0.45, taxaBase: 0.55 }).rotulo, 'Abaixo da base');
});

caso('recomendacao sem direcao nao tem leitura de acerto', () => {
  assert.equal(leituraDoPlacar({ amostraSuficiente: true, taxaAcerto: null, taxaBase: null }).rotulo, 'Sem direção');
});

caso('percentual com sinal e virgula', () => {
  assert.equal(formatarPercentual(0.0315), '+3,2%');
  assert.equal(formatarPercentual(-0.02), '-2,0%');
  assert.equal(formatarPercentual(null), '—');
});


caso('com intervalo, so e acima/abaixo da base quando o intervalo nao cruza a taxa-base', () => {
  const linha = (inferior, superior) => ({
    amostraSuficiente: true, taxaAcerto: 0.58, taxaBase: 0.52, icAcerto: { inferior, superior },
  });
  assert.equal(leituraDoPlacar(linha(0.46, 0.69)).rotulo, 'Indistinguível da base');
  assert.equal(leituraDoPlacar(linha(0.53, 0.63)).rotulo, 'Acima da base');
  assert.equal(leituraDoPlacar(linha(0.30, 0.50)).rotulo, 'Abaixo da base');
});

caso('wilson da tela confere com o do gestor (14 em 24)', () => {
  const ic = wilson(14, 24);
  assert.equal(ic.inferior.toFixed(4), '0.3883');
  assert.equal(ic.superior.toFixed(4), '0.7553');
});

caso('taxa com intervalo formatada', () => {
  assert.equal(formatarTaxaComIc(0.5833, { inferior: 0.3883, superior: 0.7553 }), '58% (39–76%)');
  assert.equal(formatarTaxaComIc(0.5833, null), '58%');
});

console.log(`\nTODOS os ${casos} casos do diario de sinais passaram`);
