// REQ-UX-9: abas da ficha e comunicados do ativo.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

import { ABAS, abaDoHash, abaValida, hashDaFicha, proximaAba } from '../public/js/analise/abasFicha.js';
const { renderizar } = await import('../public/js/components/ficha/ComunicadosDoAtivo.js');

assert.deepEqual(ABAS.map((a) => a.id), ['resumo', 'fundamentos', 'fatores', 'comunicados']);
assert.equal(abaValida('fatores'), 'fatores');
assert.equal(abaValida('hack"><script>'), 'resumo');
assert.equal(abaDoHash('#/gestao/PETR4?aba=comunicados'), 'comunicados');
assert.equal(abaDoHash('#/gestao/PETR4'), 'resumo');
assert.equal(abaDoHash('#/gestao/PETR4?aba=nada'), 'resumo');
assert.equal(hashDaFicha('PETR4', 'resumo'), '#/gestao/PETR4');
assert.equal(hashDaFicha('PETR4', 'fatores'), '#/gestao/PETR4?aba=fatores');
assert.equal(hashDaFicha('A B', 'x'), '#/gestao/A%20B');
assert.equal(proximaAba('resumo', 'ArrowRight'), 'fundamentos');
assert.equal(proximaAba('resumo', 'ArrowLeft'), 'comunicados');
assert.equal(proximaAba('fatores', 'Home'), 'resumo');
assert.equal(proximaAba('fatores', 'End'), 'comunicados');
assert.equal(proximaAba('fatores', 'a'), null);

assert.match(renderizar('PETR4', { comunicados: [] }), /Sem comunicados/);
const html = renderizar('PETR4', { comunicados: [{ dataEntrega: '2026-09-30', categoria: 'FATO_RELEVANTE', assunto: 'Fato <b>x</b>', link: 'https://exemplo.test/doc', versao: 1 }], fonte: 'CVM' });
assert.match(html, /Fato relevante/);
assert.ok(!html.includes('<b>x</b>'));
assert.match(html, /comunicados\?simbolo=PETR4/);
console.log('abas.test.mjs ok');
