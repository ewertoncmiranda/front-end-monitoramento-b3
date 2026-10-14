import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };
const { resumoProventos } = await import('../../public/js/components/ficha360/secoes/SecaoProventos.js');
const { resumoOpcoes } = await import('../../public/js/components/ficha360/secoes/SecaoOpcoes.js');

test('proventos aceita o DTO camelCase Java e calcula DY/payout sem zerar ausências', () => {
  const ano = new Date().toISOString().slice(0, 10);
  const p = resumoProventos([{ tipoDoc: 'DFP', dtFimExercicio: ano, porAcao: 1, total: 50 }], { lucro_liquido: 100 }, 10);
  assert.equal(p.dy, 0.1);
  assert.equal(p.payout, 0.5);
  assert.equal(resumoProventos([], {}, null).dy, null);
});

test('resumo de opções aceita camelCase e conta apenas séries negociadas', () => {
  const r = resumoOpcoes({ status: 'OK', vencimentos: ['202612'], opcoes: [
    { bdi: '12', precoExercicio: 10, numeroNegocios: 4 },
    { bdi: '14', precoExercicio: 12, numeroNegocios: 0 },
  ] });
  assert.equal(r.calls, 1);
  assert.equal(r.puts, 0);
  assert.equal(r.strikeMaisNegociado, 10);
  assert.deepEqual(r.vencimentos, ['202612']);
});
