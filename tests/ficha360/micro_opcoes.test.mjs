import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };
const m = await import('../../public/js/analise/opcoesMicro.js');
const { resumoOpcoes } = await import('../../public/js/components/ficha360/secoes/SecaoOpcoes.js');

test('preço justo: usa o dado do gestor ou deriva do meio; zero/cruzada/ausente => null', () => {
  assert.equal(m.precoJusto({ precoJusto: 1.5 }), 1.5);
  assert.equal(m.precoJusto({ melhorOfertaCompra: 1, melhorOfertaVenda: 2 }), 1.5);
  assert.equal(m.precoJusto({ melhorOfertaCompra: 0, melhorOfertaVenda: 2 }), null);
  assert.equal(m.precoJusto({ melhorOfertaCompra: 3, melhorOfertaVenda: 2 }), null);
  assert.equal(m.precoJusto({ melhorOfertaCompra: 1 }), null);
  assert.equal(m.precoJusto({}), null);
  assert.equal(m.precoJusto(undefined), null);
});

test('spread %: relativo ao meio; null sem preço justo', () => {
  assert.equal(m.spreadPercentual({ melhorOfertaCompra: 1, melhorOfertaVenda: 2 }), (1 / 1.5) * 100);
  assert.equal(m.spreadPercentual({ precoJusto: 2, spreadPercentual: 8 }), 8);
  assert.equal(m.spreadPercentual({ melhorOfertaCompra: 0, melhorOfertaVenda: 2 }), null);
  assert.equal(m.spreadPercentual({}), null);
});

test('selo de strike corrigido: ausente, vazio e "0" não marcam', () => {
  assert.equal(m.strikeCorrigido({}), false);
  assert.equal(m.strikeCorrigido({ indiceCorrecao: '0' }), false);
  assert.equal(m.strikeCorrigido({ indiceCorrecao: ' ' }), false);
  assert.equal(m.strikeCorrigido({ indiceCorrecao: null }), false);
  assert.equal(m.strikeCorrigido({ indiceCorrecao: '1' }), true);
  assert.equal(m.strikeCorrigido({ indice_correcao: '8' }), true);
});

test('preço para cálculo prefere o meio e informa a origem', () => {
  assert.deepEqual(m.precoParaCalculo({ precoJusto: 2, preco_medio: 3 }), { valor: 2, origem: 'meio' });
  assert.deepEqual(m.precoParaCalculo({ preco_medio: 3 }), { valor: 3, origem: 'ultimo' });
  assert.deepEqual(m.precoParaCalculo({ fechamento: 4 }), { valor: 4, origem: 'ultimo' });
  assert.deepEqual(m.precoParaCalculo({}), { valor: null, origem: null });
});

test('último negócio defasado: acima do limite só com preço justo', () => {
  assert.equal(m.LIMITE_DEFASAGEM_ULTIMO_NEGOCIO, 0.10);
  assert.equal(m.ultimoNegocioDefasado({ precoJusto: 1, fechamento: 1.2 }), true);
  assert.equal(m.ultimoNegocioDefasado({ precoJusto: 1, fechamento: 1.05 }), false);
  assert.equal(m.ultimoNegocioDefasado({ fechamento: 5 }), false);
});

test('mediana e resumo do vencimento mais próximo; campos ausentes não quebram', () => {
  assert.equal(m.mediana([3, 1, 2]), 2);
  assert.equal(m.mediana([1, 2, 3, 4]), 2.5);
  assert.equal(m.mediana([]), null);
  const r = m.resumoMicroestrutura([
    { data_vencimento: '2026-12-18', precoJusto: 1, spreadPercentual: 10 },
    { data_vencimento: '2026-12-18', precoJusto: 2, spreadPercentual: 30, indiceCorrecao: '1' },
    { data_vencimento: '2026-12-18' },
    { data_vencimento: '2027-01-15', precoJusto: 1, spreadPercentual: 99 },
  ]);
  assert.equal(r.vencimento, '2026-12-18');
  assert.equal(r.series, 3);
  assert.equal(r.comOferta, 2);
  assert.equal(r.spreadMediano, 20);
  assert.equal(r.strikesCorrigidos, 1);
  const vazio = m.resumoMicroestrutura(undefined);
  assert.equal(vazio.series, 0);
  assert.equal(vazio.spreadMediano, null);
});

test('resumoOpcoes da ficha inclui micro e tolera gestor sem os campos novos', () => {
  const r = resumoOpcoes({ opcoes: [{ bdi: '12', preco_exercicio: 10, data_vencimento: '2026-12-18' }] });
  assert.equal(r.micro.comOferta, 0);
  assert.equal(r.micro.spreadMediano, null);
});
