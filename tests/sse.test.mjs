// TASK-CHAT-6: leitor SSE (public/js/analise/sse.js) e conversar() do iaApi.js.
import assert from 'node:assert/strict';
import { CODIGO_RESPOSTA_INVALIDA, criarLeitorSSE, lerEventosSSE } from '../public/js/analise/sse.js';

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

await caso('evento partido em dois pedacos so sai quando fecha', () => {
  const l = criarLeitorSSE();
  assert.deepEqual(l.alimentar('event: tok'), []);
  assert.deepEqual(l.alimentar('en\ndata: {"texto":"oi"}'), []);
  assert.deepEqual(l.alimentar('\n\n'), [{ evento: 'token', dados: { texto: 'oi' } }]);
});

await caso('varios eventos num pedaco, na ordem', () => {
  const eventos = lerEventosSSE('event: inicio\ndata: {"modelo":"g"}\n\nevent: token\ndata: {"texto":"a"}\n\nevent: fim\ndata: {}\n\n');
  assert.deepEqual(eventos.map((e) => e.evento), ['inicio', 'token', 'fim']);
  assert.equal(eventos[0].dados.modelo, 'g');
});

await caso('CRLF, comentario e evento final sem linha em branco', () => {
  const eventos = lerEventosSSE(': keep-alive\r\n\r\nevent: fim\r\ndata: {"restante_hoje":3}');
  assert.deepEqual(eventos, [{ evento: 'fim', dados: { restante_hoje: 3 } }]);
});

await caso('data em varias linhas junta com quebra; sem event vira message', () => {
  assert.deepEqual(lerEventosSSE('data: {"a":\ndata: 1}\n\n'), [{ evento: 'message', dados: { a: 1 } }]);
});

await caso('data que nao e JSON vira erro local', () => {
  const [e] = lerEventosSSE('event: token\ndata: <html>\n\n');
  assert.equal(e.evento, 'erro');
  assert.equal(e.dados.codigo, CODIGO_RESPOSTA_INVALIDA);
});

// conversar(): fetch falso com corpo em fluxo.
function respostaEmFluxo(pedacos, status = 200) {
  const codificador = new TextEncoder();
  const corpo = new ReadableStream({
    start(controle) {
      pedacos.forEach((p) => controle.enqueue(codificador.encode(p)));
      controle.close();
    },
  });
  return new Response(corpo, { status, headers: { 'content-type': 'text/event-stream' } });
}

const { conversar } = await import('../public/js/api/iaApi.js');

await caso('conversar repassa os eventos e manda o corpo do CTR-IA-02', async () => {
  let pedido;
  globalThis.fetch = async (url, opcoes) => {
    pedido = { url, corpo: JSON.parse(opcoes.body) };
    return respostaEmFluxo(['event: inicio\ndata: {"modelo":"g"}\n\nevent: tok', 'en\ndata: {"texto":"Olá"}\n\nevent: fim\ndata: {}\n\n']);
  };
  const eventos = [];
  await conversar({ sessaoId: 's1', mensagem: 'oi', simbolo: 'WEGE3' }, { aoEvento: (e) => eventos.push(e) });
  assert.equal(pedido.url, '/ia/chat');
  assert.deepEqual(pedido.corpo, { sessao_id: 's1', mensagem: 'oi', simbolo: 'WEGE3' });
  assert.deepEqual(eventos.map((e) => e.evento), ['inicio', 'token', 'fim']);
});

await caso('conversar: HTTP 503 e rede fora viram evento erro INDISPONIVEL; 429 vira LIMITE', async () => {
  const eventos = [];
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  await conversar({ sessaoId: 's', mensagem: 'oi' }, { aoEvento: (e) => eventos.push(e) });
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await conversar({ sessaoId: 's', mensagem: 'oi' }, { aoEvento: (e) => eventos.push(e) });
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  await conversar({ sessaoId: 's', mensagem: 'oi' }, { aoEvento: (e) => eventos.push(e) });
  assert.deepEqual(eventos.map((e) => [e.evento, e.dados.codigo]),
    [['erro', 'INDISPONIVEL'], ['erro', 'INDISPONIVEL'], ['erro', 'LIMITE']]);
});

await caso('conversar abortado nao emite erro', async () => {
  const eventos = [];
  globalThis.fetch = async () => { const e = new Error('abortado'); e.name = 'AbortError'; throw e; };
  await conversar({ sessaoId: 's', mensagem: 'oi' }, { aoEvento: (e) => eventos.push(e) });
  assert.deepEqual(eventos, []);
});

console.log(`sse.test.mjs: ${casos} casos ok`);
