// TASK-CHAT-6: componente <chat-ia> (public/js/components/ia/ChatIa.js) com um
// DOM minimo simulado: textContent nunca vira HTML, fluxo inicio->token->fim
// monta um balao, erro INDISPONIVEL mostra o horario, sem sessionStorage funciona.
import assert from 'node:assert/strict';

// --- DOM minimo -------------------------------------------------------------
class Elemento {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.title = '';
    this.dataset = {};
    this.disabled = false;
    this.value = '';
    this._ouvintes = {};
    const self = this;
    this.classList = {
      add(c) { if (!self.className.split(' ').includes(c)) self.className = `${self.className} ${c}`.trim(); },
      toggle(c, ligar) { if (ligar) this.add(c); else self.className = self.className.split(' ').filter((x) => x !== c).join(' '); },
    };
  }
  get childNodes() { return this.children; }
  appendChild(filho) { this.children.push(filho); return filho; }
  replaceChildren(...filhos) { this.children = filhos; }
  addEventListener(tipo, fn) { (this._ouvintes[tipo] ||= []).push(fn); }
  focus() {}
}
globalThis.document = { createElement: (tag) => new Elemento(tag) };
globalThis.HTMLElement = class extends Elemento { constructor() { super('chat-ia'); } };
globalThis.customElements = { define() {} };

const { ChatIa, textoDoErro, horaDeBrasilia, MENSAGENS_DE_ERRO } = await import('../public/js/components/ia/ChatIa.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

/** Monta o componente sem innerHTML real: so os nos que o codigo consulta. */
function montar({ simbolo = null, armazenamento } = {}) {
  globalThis.sessionStorage = armazenamento;
  const c = new ChatIa();
  c.getAttribute = (n) => (n === 'simbolo' ? simbolo : null);
  const nos = {
    '.chat-ia-lista': new Elemento('ol'), textarea: new Elemento('textarea'),
    '[data-enviar]': new Elemento('button'), '[data-parar]': new Elemento('button'),
    '.chat-ia-rodape': new Elemento('p'), form: new Elemento('form'),
  };
  c.querySelector = (s) => nos[s];
  c.querySelectorAll = () => [];
  c.connectedCallback();
  return { c, lista: nos['.chat-ia-lista'], rodape: nos['.chat-ia-rodape'] };
}

function fluxo(texto) {
  const corpo = new ReadableStream({ start(k) { k.enqueue(new TextEncoder().encode(texto)); k.close(); } });
  return async () => new Response(corpo, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

const textoDe = (li) => li.children[0].textContent;

await caso('horaDeBrasilia e textoDoErro', () => {
  assert.equal(horaDeBrasilia('2026-10-08T18:00:00Z'), '15:00');
  assert.equal(horaDeBrasilia('lixo'), '');
  assert.equal(textoDoErro({ codigo: 'INDISPONIVEL', tentar_apos: '2026-10-08T18:00:00Z' }), 'Assistente indisponível até 15:00.');
  assert.equal(textoDoErro({ codigo: 'FORA_DO_TEMA' }), MENSAGENS_DE_ERRO.FORA_DO_TEMA);
  assert.equal(textoDoErro({ codigo: 'NOVO', mensagem: 'Outro motivo.' }), 'Outro motivo.');
});

await caso('inicio -> token -> fontes -> fim monta um balao do usuario e um da IA', async () => {
  globalThis.fetch = fluxo('event: inicio\ndata: {"modelo":"gemini-x"}\n\nevent: token\ndata: {"texto":"Olá, "}\n\n'
    + 'event: token\ndata: {"texto":"WEGE3."}\n\nevent: fontes\ndata: {"fontes":[{"tipo":"ficha","rotulo":"Ficha WEGE3"}]}\n\n'
    + 'event: fim\ndata: {}\n\n');
  const { c, lista, rodape } = montar({ simbolo: 'wege3' });
  await c.enviar('Como está a WEGE3?');
  assert.equal(lista.children.length, 2);
  assert.match(lista.children[0].className, /chat-ia-usuario/);
  assert.equal(textoDe(lista.children[1]), 'Olá, WEGE3.');
  assert.equal(lista.children[1].children[1].children[0].textContent, 'Ficha WEGE3');
  assert.match(rodape.textContent, /gemini-x/);
});

await caso('<script> da resposta fica como texto, nunca HTML', async () => {
  globalThis.fetch = fluxo('event: token\ndata: {"texto":"<script>alert(1)</script>"}\n\nevent: fim\ndata: {}\n\n');
  const { c, lista } = montar();
  await c.enviar('oi');
  const resposta = lista.children[1];
  assert.equal(textoDe(resposta), '<script>alert(1)</script>');
  assert.equal(resposta.innerHTML, undefined);
});

await caso('erro INDISPONIVEL mostra horario e marca o balao como erro', async () => {
  globalThis.fetch = fluxo('event: erro\ndata: {"codigo":"INDISPONIVEL","mensagem":"x","tentar_apos":"2026-10-08T18:00:00Z"}\n\n');
  const { c, lista } = montar();
  await c.enviar('oi');
  assert.match(lista.children[1].className, /chat-ia-erro/);
  assert.match(textoDe(lista.children[1]), /até 15:00/);
});

await caso('sem sessionStorage (acesso lanca) o chat funciona', async () => {
  const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  globalThis.fetch = fluxo('event: token\ndata: {"texto":"ok"}\n\nevent: fim\ndata: {}\n\n');
  const { c, lista } = montar({ armazenamento: quebrado });
  await c.enviar('oi');
  assert.equal(textoDe(lista.children[1]), 'ok');
});

await caso('historico volta da mesma chave e mensagem vazia nao envia', async () => {
  const guardado = {};
  const memoria = { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = v; } };
  globalThis.fetch = fluxo('event: token\ndata: {"texto":"r1"}\n\nevent: fim\ndata: {}\n\n');
  const primeiro = montar({ simbolo: 'PETR4', armazenamento: memoria });
  await primeiro.c.enviar('p1');
  await primeiro.c.enviar('   ');
  const segundo = montar({ simbolo: 'PETR4', armazenamento: memoria });
  assert.deepEqual(segundo.lista.children.map(textoDe), ['p1', 'r1']);
  assert.ok(guardado['chat:PETR4']);
});

console.log(`chatIa.test.mjs: ${casos} casos ok`);
