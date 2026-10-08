// TASK-CHAT-1: proxy /ia/* remove o prefixo, bloqueia /ia/opiniao*, remove
// Origin, responde 503 com o servico fora e repassa SSE sem acumular.
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { caminhoBloqueado, registrarProxyIa } from '../proxy/iaProxy.js';

function escutar(servidor) {
  return new Promise(resolve => servidor.listen(0, '127.0.0.1', () => resolve(servidor)));
}

function fechar(servidor) {
  return new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
}

assert.equal(caminhoBloqueado('/opiniao'), true);
assert.equal(caminhoBloqueado('/opiniao/ativo'), true);
assert.equal(caminhoBloqueado('/opiniao?x=1'), true);
assert.equal(caminhoBloqueado('/indexar'), true);
assert.equal(caminhoBloqueado('/opinioes'), false);
assert.equal(caminhoBloqueado('/chat'), false);

let liberarSegundoEvento;
const segundoEventoLiberado = new Promise(resolve => { liberarSegundoEvento = resolve; });
const recebidas = [];
const servicoIa = await escutar(http.createServer((req, res) => {
  recebidas.push({ metodo: req.method, url: req.url, origin: req.headers.origin });
  if (req.url === '/chat') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    res.write('event: inicio\ndata: {"modelo":"m"}\n\n');
    // So manda o fim depois que o cliente ja leu o primeiro evento:
    // se o proxy acumulasse, o teste travaria aqui.
    segundoEventoLiberado.then(() => res.end('event: fim\ndata: {}\n\n'));
    return;
  }
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(recebidas.at(-1)));
}));

const app = express();
registrarProxyIa(app, `http://127.0.0.1:${servicoIa.address().port}`);
const frontend = await escutar(http.createServer(app));
const base = `http://127.0.0.1:${frontend.address().port}`;

const appSemServico = express();
registrarProxyIa(appSemServico, 'http://127.0.0.1:1');
const frontendSemServico = await escutar(http.createServer(appSemServico));

try {
  const pacote = await fetch(`${base}/ia/ativo/WEGE3?x=1`, {
    headers: { Origin: 'http://127.0.0.1:8082' },
  }).then(r => r.json());
  assert.deepEqual(pacote, { metodo: 'GET', url: '/ativo/WEGE3?x=1' });

  const saude = await fetch(`${base}/ia/saude`).then(r => r.json());
  assert.equal(saude.url, '/saude');

  const bloqueada = await fetch(`${base}/ia/opiniao/ativo`, { method: 'POST' });
  assert.equal(bloqueada.status, 403);
  assert.deepEqual(await bloqueada.json(), { erro: 'ROTA_NAO_PERMITIDA' });
  assert.equal(recebidas.some(r => r.url.startsWith('/opiniao')), false);

  const chat = await fetch(`${base}/ia/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'http://localhost:8082' },
    body: '{"mensagem":"oi"}',
  });
  assert.equal(chat.headers.get('content-type'), 'text/event-stream');
  const leitor = chat.body.getReader();
  const decodificador = new TextDecoder();
  const primeiro = decodificador.decode((await leitor.read()).value);
  assert.match(primeiro, /event: inicio/);
  liberarSegundoEvento();
  let resto = '';
  for (let parte = await leitor.read(); !parte.done; parte = await leitor.read()) {
    resto += decodificador.decode(parte.value);
  }
  assert.match(resto, /event: fim/);
  const doChat = recebidas.find(r => r.url === '/chat');
  assert.equal(doChat.metodo, 'POST');
  assert.equal(doChat.origin, undefined);

  const fora = await fetch(`http://127.0.0.1:${frontendSemServico.address().port}/ia/saude`);
  assert.equal(fora.status, 503);
  assert.deepEqual(await fora.json(), { erro: 'IA_INDISPONIVEL' });
} finally {
  await fechar(frontend);
  await fechar(frontendSemServico);
  await fechar(servicoIa);
}

console.log('iaProxy.test.mjs ok');
