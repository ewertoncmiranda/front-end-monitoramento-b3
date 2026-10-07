// Plano LAC no painel: leitura de fatores, proventos e ranking (public/js/analise/lacunas.js).
import assert from 'node:assert/strict';
import {
  agruparFatores, formatarMoedaCompacta, formatarPercentilFator, janelasPorVersao,
  leituraDoPercentil, totalDoProvento, vereditoDoRanking,
} from '../public/js/analise/lacunas.js';

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

caso('fatores agrupados por familia na ordem preco, qualidade, valor, evento', () => {
  const g = agruparFatores([
    { codigo: 'a', familia: 'EVENTO' }, { codigo: 'b', familia: 'PRECO' }, { codigo: 'c', familia: 'VALOR' },
    { codigo: 'd', familia: 'QUALIDADE' }, { codigo: 'e', familia: 'PRECO' }, { codigo: 'f', familia: 'NOVA' },
  ]);
  assert.deepEqual(g.map((x) => x.chave), ['PRECO', 'QUALIDADE', 'VALOR', 'EVENTO', 'NOVA']);
  assert.equal(g[0].fatores.length, 2);
  assert.equal(g[0].rotulo, 'Preço');
  assert.deepEqual(agruparFatores(null), []);
});

caso('percentil em texto e leitura pela direcao esperada', () => {
  assert.equal(formatarPercentilFator(0.734), 'P73');
  assert.equal(formatarPercentilFator(73), 'P73');
  assert.equal(formatarPercentilFator(null), '—');
  assert.equal(leituraDoPercentil(0.9, 1), 'FAVORAVEL');
  assert.equal(leituraDoPercentil(0.9, -1), 'DESFAVORAVEL');
  assert.equal(leituraDoPercentil(0.5, 1), 'NEUTRO');
  assert.equal(leituraDoPercentil(null, 1), null);
});

caso('provento: total ausente soma jcp e dividendos; ambos ausentes ficam nulos (nunca 0)', () => {
  assert.equal(totalDoProvento({ total: 10, jcp: 1, dividendos: 1 }), 10);
  assert.equal(totalDoProvento({ total: null, jcp: 3, dividendos: 4 }), 7);
  assert.equal(totalDoProvento({ total: null, jcp: null, dividendos: 4 }), 4);
  assert.equal(totalDoProvento({ total: null, jcp: null, dividendos: null }), null);
  assert.equal(formatarMoedaCompacta(null), '—');
  assert.equal(formatarMoedaCompacta(1134258), 'R$ 1,13 mi');
  assert.equal(formatarMoedaCompacta(2500), 'R$ 2,5 mil');
});

caso('ranking: so IC todo acima de zero e vantagem; sem IC e amostra pequena', () => {
  assert.equal(vereditoDoRanking({ icCorrelacao: { inferior: 0.01, superior: 0.1 } }), 'ORDENA');
  assert.equal(vereditoDoRanking({ icCorrelacao: { inferior: -0.1, superior: 0.1 } }), 'INCONCLUSIVO');
  assert.equal(vereditoDoRanking({ icCorrelacao: { inferior: -0.1, superior: -0.01 } }), 'ORDENA_AO_CONTRARIO');
  assert.equal(vereditoDoRanking({ icCorrelacao: null }), 'AMOSTRA_PEQUENA');
  assert.equal(vereditoDoRanking(null), 'AMOSTRA_PEQUENA');
});

caso('janelas agrupadas por versao da regra', () => {
  const g = janelasPorVersao([{ versaoRegra: 'v1', janela: 'A' }, { versaoRegra: 'v2', janela: 'A' }, { versaoRegra: 'v1', janela: 'B' }]);
  assert.deepEqual(g.map((x) => [x.versao, x.janelas.length]), [['v1', 2], ['v2', 1]]);
});

console.log(`${casos} casos ok`);
