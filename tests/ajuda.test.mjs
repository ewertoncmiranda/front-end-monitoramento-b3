import assert from 'node:assert/strict';

const listeners = new Map();
const documento = {
  addEventListener(tipo, callback) { listeners.set(tipo, callback); },
  querySelectorAll() { return popoverAberto ? [popover] : []; },
};
globalThis.document = documento;

let popoverAberto = false;
const popover = {
  classList: {
    contains() { return popoverAberto; },
    add() { popoverAberto = true; },
    remove() { popoverAberto = false; },
    toggle(_nome, valor) { popoverAberto = valor; },
  },
  closest(seletor) { return seletor === '[data-ajuda-container]' ? container : null; },
};
const atributos = new Map();
const botao = {
  setAttribute(chave, valor) { atributos.set(chave, valor); },
  closest(seletor) {
    return seletor === '[data-ajuda-toggle]' || seletor === '[data-ajuda-container]' ? (seletor.includes('toggle') ? botao : container) : null;
  },
};
const fecharBotao = { closest: (seletor) => (seletor === '[data-ajuda-fechar]' ? fecharBotao : seletor === '[data-ajuda-container]' ? container : null) };
const container = {
  closest: (seletor) => (seletor === '[data-ajuda-container]' ? container : null),
  querySelector: (seletor) => (seletor === '.ajuda-popover' ? popover : seletor === '[data-ajuda-toggle]' ? botao : null),
};

const { htmlAjuda } = await import('../public/js/utils/ajuda.js');
const html = htmlAjuda('ajuda-xss', '<Título>', 'Texto <script>alert(1)</script> & seguro');
assert.match(html, /role="tooltip"/);
assert.match(html, /aria-expanded="false"/);
assert.match(html, /aria-describedby="ajuda-xss-popover"/);
assert.match(html, /&lt;Título&gt;/);
assert.match(html, /Texto &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; seguro/);
assert.doesNotMatch(html, /<script>/);

listeners.get('click')({ target: botao });
assert.equal(popoverAberto, true);
assert.equal(atributos.get('aria-expanded'), 'true');

listeners.get('mousedown')({ target: { closest: () => null } });
assert.equal(popoverAberto, false);
assert.equal(atributos.get('aria-expanded'), 'false');

listeners.get('click')({ target: botao });
listeners.get('click')({ target: fecharBotao });
assert.equal(popoverAberto, false);

console.log('ajuda: abre, fecha ao clicar fora ou no × e escapa título/texto');
