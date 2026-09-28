// Testes da leitura da ficha do ativo (public/js/analise/fichaDoAtivo.js).
// Node puro, mesmo estilo dos demais testes do painel.

import assert from 'node:assert/strict';
import {
  historicoDoSinal,
  indicadores,
  precoDasVelas,
  reguaDeValor,
  selosDeQualidade,
} from '../public/js/analise/fichaDoAtivo.js';

let casos = 0;
function caso(nome, fn) {
  fn();
  casos++;
  console.log(`  ok  ${nome}`);
}

const linha = (recomendacao, direcao, inferior, superior, extra = {}) => ({
  versaoRegra: 'v', periodo: 'TESTE', horizonte: 63, recomendacao, direcao,
  amostraSuficiente: true, icExcessoCarteira: { inferior, superior }, ...extra,
});

caso('compra so tem vantagem quando o intervalo do excesso fica todo acima de zero', () => {
  assert.equal(historicoDoSinal([linha('COMPRA_FORTE', 1, 0.01, 0.05)], 'v', 'COMPRA_FORTE').veredito, 'VANTAGEM');
  assert.equal(historicoDoSinal([linha('COMPRA_FORTE', 1, -0.01, 0.05)], 'v', 'COMPRA_FORTE').veredito, 'INCONCLUSIVO');
  assert.equal(historicoDoSinal([linha('COMPRA_FORTE', 1, -0.05, -0.01)], 'v', 'COMPRA_FORTE').veredito, 'DESVANTAGEM');
});

caso('venda le o excesso invertido: ativo abaixo da carteira e acerto', () => {
  assert.equal(historicoDoSinal([linha('VENDA_VALUATION', -1, -0.05, -0.01)], 'v', 'VENDA_VALUATION').veredito, 'VANTAGEM');
  assert.equal(historicoDoSinal([linha('VENDA_VALUATION', -1, 0.01, 0.05)], 'v', 'VENDA_VALUATION').veredito, 'DESVANTAGEM');
});

caso('sinal neutro, amostra pequena, calibracao e sinal ausente', () => {
  assert.equal(historicoDoSinal([linha('MANTER', 0, 0.01, 0.05)], 'v', 'MANTER').veredito, 'NEUTRO');
  assert.equal(historicoDoSinal([linha('COMPRA_FORTE', 1, 0.01, 0.05, { amostraSuficiente: false })], 'v', 'COMPRA_FORTE').veredito, 'AMOSTRA_PEQUENA');
  assert.equal(historicoDoSinal([linha('COMPRA_FORTE', 1, 0.01, 0.05, { periodo: 'CALIBRACAO' })], 'v', 'COMPRA_FORTE'), null);
  assert.equal(historicoDoSinal(null, 'v', 'COMPRA_FORTE'), null);
});

caso('preco do cabecalho vem da ultima vela, com variacao contra a anterior', () => {
  const p = precoDasVelas([
    { close: 50, dataIso: '2026-09-24', fonte: 'B3_COTAHIST' },
    { close: 51, dataIso: '2026-09-25', fonte: 'B3_COTAHIST' },
  ]);
  assert.equal(p.preco, 51);
  assert.equal(Math.round(p.variacao * 100) / 100, 2);
  assert.equal(p.data, '2026-09-25');
  assert.equal(precoDasVelas([]), null);
});

caso('regua poe cenarios e preco na mesma escala, em ordem, dentro de 0-100', () => {
  const valuation = { cenarios_graham: {
    conservador: { preco_justo: 40, margem_seguranca_percent: -20 },
    base: { preco_justo: 60, margem_seguranca_percent: 20 },
    otimista: { preco_justo: 80, margem_seguranca_percent: 40 },
  } };
  const r = reguaDeValor(valuation, 48);
  const [c, b, o] = r.marcas.map((m) => m.posicao);
  assert.ok(c > 0 && c < r.preco.posicao && r.preco.posicao < b && b < o && o < 100);
  assert.equal(r.margemBase, 20);
  assert.equal(reguaDeValor({}, 48), null);
});

caso('selos avisam balanco velho e serie curta; indicadores so com dado presente', () => {
  const hoje = new Date('2026-09-28T12:00:00');
  const selos = selosDeQualidade({
    fundamentos: { dataAnalise: '2026-09-27T22:00:00', detalhes: { contexto_tecnico_serie: { amostras: 12 } } },
    cvm: { tipo_doc: 'DFP', periodo: '2024-12-31', defasagem_dias: 600, cobertura: {} },
    ultimaVela: { data: '2026-09-25', fonte: 'B3_COTAHIST' },
  }, hoje);
  const tom = (texto) => selos.find((s) => s.texto.includes(texto)).tom;
  assert.equal(tom('Preço'), 'success');
  assert.equal(tom('Balanço'), 'warning');
  assert.equal(tom('Série'), 'warning');
  assert.deepEqual(indicadores(null, null), []);
  assert.deepEqual(indicadores(null, { roe: 20 }).map((i) => i.chave), ['roe']);
});

console.log(`ficha: ${casos} casos ok`);
