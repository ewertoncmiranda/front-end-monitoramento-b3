// Testes da regra que liga comunicado da CVM a vela (analise/comunicadosPorCandle.js).
// Node puro, mesmo estilo do detector.test.mjs.

import assert from 'node:assert/strict';
import {
  agruparPorCandle,
  marcadoresDeComunicados,
} from '../public/js/analise/comunicadosPorCandle.js';

// Quinta 17, sexta 18, segunda 21 e terca 22/09/2026: fim de semana no meio.
const velas = ['2026-09-17', '2026-09-18', '2026-09-21', '2026-09-22'].map((dataIso) => ({ dataIso }));
const doc = (protocolo, dataEntrega, categoria = 'COMUNICADO_MERCADO') => ({
  protocolo,
  dataEntrega,
  categoria,
});

let casos = 0;
function caso(nome, fn) {
  fn();
  casos++;
  console.log(`  ok  ${nome}`);
}

caso('documento do dia fica em noDia da propria vela', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-18')]);
  assert.deepEqual(grupos.get('2026-09-18').noDia.map((d) => d.protocolo), ['1']);
});

caso('documento de dia de pregao tambem aparece na vela seguinte, como possivel apos o fechamento', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-18')]);
  const segunda = grupos.get('2026-09-21');
  assert.deepEqual(segunda.desdeAnterior.map((d) => d.protocolo), ['1']);
  assert.equal(segunda.anteriorIso, '2026-09-18');
});

caso('documento de sabado vai para a segunda, e so para ela', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-19')]);
  assert.equal(grupos.get('2026-09-18'), undefined);
  assert.deepEqual(grupos.get('2026-09-21').desdeAnterior.map((d) => d.protocolo), ['1']);
  assert.deepEqual(grupos.get('2026-09-21').noDia, []);
});

caso('documento anterior a primeira vela ou posterior a ultima nao entra', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-10'), doc('2', '2026-09-30')]);
  assert.equal(grupos.size, 0);
});

caso('primeira vela so tem noDia: nao ha pregao anterior para comparar', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-17')]);
  assert.deepEqual(grupos.get('2026-09-17').desdeAnterior, []);
});

caso('marcador: um por vela, sem contar duas vezes o documento do dia anterior', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-18')]);
  const marcadores = marcadoresDeComunicados(velas, grupos);
  assert.deepEqual(marcadores.map((m) => m.dataIso), ['2026-09-18']);
});

caso('marcador: documento de fim de semana marca a segunda-feira', () => {
  const grupos = agruparPorCandle(velas, [doc('1', '2026-09-20')]);
  assert.deepEqual(marcadoresDeComunicados(velas, grupos).map((m) => m.dataIso), ['2026-09-21']);
});

caso('marcador: fato relevante tem cor propria e a contagem aparece acima de 1', () => {
  const grupos = agruparPorCandle(velas, [
    doc('1', '2026-09-22', 'FATO_RELEVANTE'),
    doc('2', '2026-09-22'),
  ]);
  const [marcador] = marcadoresDeComunicados(velas, grupos, { fatoRelevante: 'R', outros: 'A' });
  assert.equal(marcador.cor, 'R');
  assert.equal(marcador.texto, '2');
});

caso('marcadores saem em ordem de data (exigencia da lightweight-charts)', () => {
  const grupos = agruparPorCandle(velas, [doc('2', '2026-09-22'), doc('1', '2026-09-17')]);
  assert.deepEqual(
    marcadoresDeComunicados(velas, grupos).map((m) => m.dataIso),
    ['2026-09-17', '2026-09-22'],
  );
});

console.log(`\nTODOS os ${casos} casos de comunicados por vela passaram`);
