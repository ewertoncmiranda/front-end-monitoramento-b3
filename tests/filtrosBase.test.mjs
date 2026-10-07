// Filtros da Base em link compartilhavel (public/js/analise/filtrosBase.js).
import assert from 'node:assert/strict';
import { hashDaBase, lerFiltrosBase } from '../public/js/analise/filtrosBase.js';

assert.equal(hashDaBase({ q: '', setor: '', pagina: 0 }), '#/base');
assert.equal(hashDaBase({ q: 'petr', setor: 'Energia', pagina: 2 }), '#/base?q=petr&setor=Energia&pagina=2');
assert.deepEqual(lerFiltrosBase('#/base?q=petr&setor=Energia&pagina=2'), { q: 'petr', setor: 'Energia', pagina: 2 });
assert.deepEqual(lerFiltrosBase(hashDaBase({ q: 'a b', setor: 'Água & Saneamento', pagina: 1 })), { q: 'a b', setor: 'Água & Saneamento', pagina: 1 });
assert.deepEqual(lerFiltrosBase('#/base?pagina=-3'), { q: '', setor: '', pagina: 0 });
assert.deepEqual(lerFiltrosBase('#/base?pagina=abc'), { q: '', setor: '', pagina: 0 });
assert.deepEqual(lerFiltrosBase('#/favoritos?q=x'), { q: '', setor: '', pagina: 0 });
assert.deepEqual(lerFiltrosBase(undefined), { q: '', setor: '', pagina: 0 });
console.log('filtrosBase.test.mjs ok');
