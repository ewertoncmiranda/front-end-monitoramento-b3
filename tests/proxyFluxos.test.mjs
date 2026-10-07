// ISS-03: proxy real preserva prefixo/query/body e remove Origin.
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { registrarProxy } from '../proxy/apiProxy.js';

function escutar(servidor) {
  return new Promise(resolve => servidor.listen(0, '127.0.0.1', () => resolve(servidor)));
}

function fechar(servidor) {
  return new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
}

const recebidas = [];
const backend = await escutar(http.createServer((req, res) => {
  let corpo = '';
  req.setEncoding('utf8');
  req.on('data', parte => { corpo += parte; });
  req.on('end', () => {
    recebidas.push({ metodo: req.method, url: req.url, origin: req.headers.origin, corpo });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(recebidas.at(-1)));
  });
}));

const app = express();
registrarProxy(app, `http://127.0.0.1:${backend.address().port}`);
const frontend = await escutar(http.createServer(app));
const base = `http://127.0.0.1:${frontend.address().port}`;

try {
  const analise = await fetch(`${base}/analises/PETR4/analise?janela=63`, {
    headers: { Origin: 'http://127.0.0.1:8082' },
  }).then(resposta => resposta.json());
  assert.deepEqual(analise, {
    metodo: 'GET',
    url: '/analises/PETR4/analise?janela=63',
    corpo: '',
  });

  const raiz = await fetch(`${base}/setores`).then(resposta => resposta.json());
  assert.equal(raiz.url, '/setores');

  const cadastro = await fetch(`${base}/ativos/registrar/PETR4`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'http://localhost:8082' },
    body: JSON.stringify({ favorito: true }),
  }).then(resposta => resposta.json());
  assert.equal(cadastro.url, '/ativos/registrar/PETR4');
  assert.equal(cadastro.metodo, 'POST');
  assert.equal(cadastro.origin, undefined);
  assert.equal(cadastro.corpo, '{"favorito":true}');
} finally {
  await fechar(frontend);
  await fechar(backend);
}

console.log('proxyFluxos.test.mjs ok');
