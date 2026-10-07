// ISS-11: estado de Estudos em link compartilhavel (public/js/estudos/urlEstado.js).
import assert from 'node:assert/strict';
import { lerEstado, montarHash } from '../public/js/estudos/urlEstado.js';

const ids = ['curso-a', 'curso-b'];
assert.equal(montarHash({ secao: 'formacoes', visao: 'planos' }), '#/estudos');
assert.equal(montarHash({ visao: 'biblioteca', nivel: 'Básico', escopo: 'Curso focal', q: 'risco' }), '#/estudos?visao=biblioteca&q=risco&nivel=B%C3%A1sico&escopo=Curso+focal');
assert.deepEqual(lerEstado(montarHash({ visao: 'biblioteca', nivel: 'Básico', escopo: 'Curso focal', q: 'risco' }), ids), { visao: 'biblioteca', q: 'risco', nivel: 'Básico', escopo: 'Curso focal' });
assert.deepEqual(lerEstado('#/estudos?curso=curso-b', ids), { curso: 'curso-b', secao: 'formacoes' });
assert.deepEqual(lerEstado('#/estudos?curso=inexistente&secao=hack&visao=x', ids), {}, 'valores desconhecidos sao ignorados');
assert.deepEqual(lerEstado('#/glossario?q=a', ids), {}, 'so vale na rota de estudos');
assert.deepEqual(lerEstado(undefined, ids), {});
console.log('urlEstado.test.mjs ok');
