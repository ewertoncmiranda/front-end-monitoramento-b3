// Filtros da tabela unica de ativos em link compartilhavel (public/js/analise/filtrosBase.js).
import assert from 'node:assert/strict';
import { hashDaBase, lerFiltrosBase } from '../public/js/analise/filtrosBase.js';

const vazio = { visao: 'todos', q: '', setor: '', pagina: 0 };

assert.equal(hashDaBase({ q: '', setor: '', pagina: 0 }), '#/ativos');
assert.equal(hashDaBase({ q: 'petr', setor: 'Energia', pagina: 2 }), '#/ativos?q=petr&setor=Energia&pagina=2');
assert.equal(hashDaBase({ visao: 'favoritos', pagina: 0 }), '#/ativos?visao=favoritos');
assert.equal(hashDaBase({ visao: 'inventada' }), '#/ativos');
assert.deepEqual(lerFiltrosBase('#/ativos?visao=monitorados&q=petr&setor=Energia&pagina=2'),
  { visao: 'monitorados', q: 'petr', setor: 'Energia', pagina: 2 });
assert.deepEqual(lerFiltrosBase(hashDaBase({ visao: 'favoritos', q: 'a b', setor: 'Água & Saneamento', pagina: 1 })),
  { visao: 'favoritos', q: 'a b', setor: 'Água & Saneamento', pagina: 1 });

// Rotas antigas continuam valendo, com os filtros que ja carregavam.
assert.deepEqual(lerFiltrosBase('#/base?q=petr&setor=Energia&pagina=2'), { visao: 'todos', q: 'petr', setor: 'Energia', pagina: 2 });
assert.deepEqual(lerFiltrosBase('#/base?visao=favoritos'), vazio, '#/base e sempre a visao todos');
assert.deepEqual(lerFiltrosBase('#/monitorados'), { ...vazio, visao: 'monitorados' });
assert.deepEqual(lerFiltrosBase('#/favoritos'), { ...vazio, visao: 'favoritos' });
assert.deepEqual(lerFiltrosBase('#/setores?setor=Bancos'), { ...vazio, setor: 'Bancos' });

assert.deepEqual(lerFiltrosBase('#/ativos?visao=xyz'), vazio);
assert.deepEqual(lerFiltrosBase('#/ativos?pagina=-3'), vazio);
assert.deepEqual(lerFiltrosBase('#/ativos?pagina=abc'), vazio);
assert.deepEqual(lerFiltrosBase('#/candles?q=x'), vazio);
assert.deepEqual(lerFiltrosBase(undefined), vazio);
console.log('filtrosBase.test.mjs ok');
