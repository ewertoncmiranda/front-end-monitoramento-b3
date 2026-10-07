import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const atributos = new Map();
const classesBody = new Set(['bg-light']);
const armazenamento = new Map();
let eventos = 0;

globalThis.CustomEvent = class {
  constructor(tipo, init = {}) {
    this.type = tipo;
    this.detail = init.detail;
  }
};

globalThis.document = {
  documentElement: {
    getAttribute(nome) { return atributos.get(nome); },
    setAttribute(nome, valor) { atributos.set(nome, valor); },
  },
  body: {
    classList: {
      add(classe) { classesBody.add(classe); },
      remove(classe) { classesBody.delete(classe); },
      contains(classe) { return classesBody.has(classe); },
    },
  },
};

globalThis.window = {
  localStorage: {
    getItem(chave) { return armazenamento.has(chave) ? armazenamento.get(chave) : null; },
    setItem(chave, valor) { armazenamento.set(chave, valor); },
  },
  dispatchEvent(evento) {
    if (evento.type === 'tema:alterado') eventos++;
  },
};

const tema = await import('../public/js/utils/tema.js');

assert.equal(tema.temaAtual(), 'light');
assert.equal(tema.aplicarTema('dark'), 'dark');
assert.equal(atributos.get('data-bs-theme'), 'dark');
assert.equal(armazenamento.get('b3.tema.v1'), 'dark');
assert.equal(classesBody.has('bg-body-tertiary'), true);
assert.equal(classesBody.has('bg-light'), false);
assert.equal(tema.alternarTema(), 'light');
assert.equal(tema.rotuloTema('light').acao, 'Usar tema escuro');
assert.equal(tema.rotuloTema('dark').acao, 'Usar tema claro');
assert.ok(eventos >= 2);

const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const header = readFileSync(new URL('../public/js/components/AppHeader.js', import.meta.url), 'utf8');
const bottom = readFileSync(new URL('../public/js/components/BottomNav.js', import.meta.url), 'utf8');
assert.match(index, /data-bs-theme/);
assert.match(index, /bg-body-tertiary/);
assert.match(header, /<tema-toggle><\/tema-toggle>/);
assert.match(bottom, /<tema-toggle modo="bottom"><\/tema-toggle>/);

console.log('tema escuro ok');
