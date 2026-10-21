// Formulario "Adicionar acoes": quantidade, total estimado, preco do dia (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {
  innerHTML = '';
  querySelector = () => null;
  querySelectorAll = () => [];
  addEventListener = () => {};
};
globalThis.customElements = { define() {}, get() { return undefined; } };

const chamadas = [];
let statusGestor = 201;
let velasPorUrl = () => [{ data: '2026-10-19', fechamento: 56.85 }, { data: '2026-10-20', fechamento: 58.21 }];
globalThis.fetch = async (url, init = {}) => {
  const corpo = init.body ? JSON.parse(init.body) : null;
  chamadas.push({ url, metodo: init.method || 'GET', corpo });
  if (String(url).includes('/pregoes')) return { ok: true, status: 200, text: async () => JSON.stringify({ velas: velasPorUrl(url) }) };
  return { ok: statusGestor < 300, status: statusGestor, text: async () => (statusGestor < 300 ? JSON.stringify({ id: 'op1' }) : JSON.stringify({ message: 'quantidade excede a posição' })) };
};

const { CarteiraAdicionarAtivo, validarCompra } = await import('../public/js/components/carteiras/CarteiraAdicionarAtivo.js');
const { hojeLocal } = await import('../public/js/api/carteirasOperacoesApi.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

// DOM falso: cada seletor devolve um elemento com value/textContent/hidden
function criarInstancia({ quantidade = '', data = hojeLocal(), corretagem = '' } = {}) {
  const inst = Object.create(CarteiraAdicionarAtivo.prototype);
  const els = {
    '#quantidade': { value: String(quantidade) }, '#data-entrada': { value: data }, '#corretagem': { value: String(corretagem) },
    '#preco': { value: '', readOnly: true }, '#preco-info': { textContent: '' }, '#btn-editar-preco': { hidden: true },
    '#total-estimado': { textContent: '' }, '#msg-form': { className: '', textContent: '' }, '#btn-adicionar': { disabled: false },
    '#seletor-ativo': { limpar() {}, setAttribute() {} },
  };
  inst.els = els;
  inst.querySelector = (s) => els[s] ?? null;
  inst._carteiraId = 'c1';
  inst._simbolo = '';
  inst._preco = { status: 'ok', valor: '', data: null, manual: false };
  inst.eventos = [];
  inst.dispatchEvent = (e) => { inst.eventos.push(e); return true; };
  return inst;
}
globalThis.CustomEvent = class { constructor(tipo, init) { this.type = tipo; this.detail = init?.detail; } };

await caso('validarCompra: ticker, quantidade inteira > 0, data nao futura, estados do preco', () => {
  const ok = { simbolo: 'PETR4', quantidade: '100', data: hojeLocal(), preco: '58.21', status: 'ok' };
  assert.equal(validarCompra(ok), null);
  assert.match(validarCompra({ ...ok, simbolo: '' }), /Selecione/);
  for (const q of ['', '0', '-5', '1.5', 'abc']) assert.match(validarCompra({ ...ok, quantidade: q }), /inteiro maior que zero/, q);
  assert.match(validarCompra({ ...ok, data: '' }), /data de entrada/);
  assert.match(validarCompra({ ...ok, data: '2999-01-01' }), /futura/);
  assert.match(validarCompra({ ...ok, status: 'carregando' }), /Aguarde/);
  assert.match(validarCompra({ ...ok, status: 'sem-cotacao' }), /não tem cotação/);
  assert.match(validarCompra({ ...ok, status: 'erro', preco: '' }), /preço do dia/);
  assert.equal(validarCompra({ ...ok, status: 'erro', preco: '10' }), null, 'erro de rede + preco manual libera');
  assert.match(validarCompra({ ...ok, preco: '0' }), /preço deve ser maior/);
});

await caso('preco do dia: busca o ultimo fechamento, rotula com a data e calcula o total em tempo real', async () => {
  const f = criarInstancia({ quantidade: '100' });
  f._simbolo = 'PETR4';
  await f._carregarPreco();
  assert.equal(f._preco.valor, '58.21');
  assert.equal(f._preco.manual, false);
  assert.equal(f.els['#preco'].value, '58.21');
  assert.equal(f.els['#preco-info'].textContent, 'Fechamento de 20-10-2026');
  assert.equal(f.els['#btn-editar-preco'].hidden, false);
  assert.equal(f.els['#total-estimado'].textContent, 'R$ 5.821,00');
  f.els['#quantidade'].value = '10';
  f._atualizarTotal();
  assert.equal(f.els['#total-estimado'].textContent, 'R$ 582,10');
  f.els['#corretagem'].value = '4.9';
  f._atualizarTotal();
  assert.equal(f.els['#total-estimado'].textContent, 'R$ 587,00');
  f.els['#quantidade'].value = '';
  f._atualizarTotal();
  assert.equal(f.els['#total-estimado'].textContent, '—');
});

await caso('ticker sem cotacao bloqueia o envio; erro de rede tem mensagem propria', async () => {
  velasPorUrl = () => [];
  const f = criarInstancia({ quantidade: '10' });
  f._simbolo = 'XXXX3';
  await f._carregarPreco();
  assert.equal(f._preco.status, 'sem-cotacao');
  assert.match(f.els['#preco-info'].textContent, /sem cotação/);
  const antes = chamadas.length;
  await f._submeter();
  assert.match(f.els['#msg-form'].textContent, /não tem cotação/);
  assert.equal(chamadas.length, antes, 'nada enviado');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('rede'); };
  await f._carregarPreco();
  assert.equal(f._preco.status, 'erro');
  assert.match(f.els['#preco-info'].textContent, /Erro de rede/);
  globalThis.fetch = realFetch;
  velasPorUrl = () => [{ data: '2026-10-20', fechamento: 58.21 }];
});

await caso('preco editado vira "preço informado manualmente"', () => {
  const f = criarInstancia({ quantidade: '10' });
  f._preco = { status: 'ok', valor: '60', data: null, manual: true };
  f._atualizarPrecoInfo();
  assert.equal(f.els['#preco-info'].textContent, 'Preço informado manualmente');
  assert.equal(f.els['#btn-editar-preco'].hidden, true);
});

await caso('envio: registra COMPRA com quantidade, preco do dia e data; avisa que nao e ordem executada', async () => {
  chamadas.length = 0;
  statusGestor = 201;
  const f = criarInstancia({ quantidade: '100', corretagem: '5' });
  f._simbolo = 'PETR4';
  await f._carregarPreco();
  await f._submeter();
  const post = chamadas.find((c) => c.metodo === 'POST');
  assert.match(post.url, /\/carteiras\/c1\/operacoes$/);
  assert.equal(post.corpo.tipo, 'COMPRA');
  assert.equal(post.corpo.simbolo, 'PETR4');
  assert.equal(post.corpo.quantidade, 100);
  assert.equal(post.corpo.precoUnitario, 58.21);
  assert.equal(post.corpo.custos, 5);
  assert.match(post.corpo.chaveIdempotencia, /^compra-/);
  assert.match(f.els['#msg-form'].textContent, /100 PETR4 a R\$ 58,21.*não ordem executada/);
  assert.equal(f.eventos[0].type, 'ativo-adicionado');
  assert.equal(f.eventos[0].detail.quantidade, 100);
  assert.equal(f._simbolo, '', 'formulario limpo');
});

await caso('erro do gestor mostra o motivo e a mesma chave e reaproveitada no reenvio', async () => {
  chamadas.length = 0;
  statusGestor = 400;
  const f = criarInstancia({ quantidade: '100' });
  f._simbolo = 'PETR4';
  await f._carregarPreco();
  await f._submeter();
  assert.match(f.els['#msg-form'].textContent, /quantidade excede a posição/);
  const k1 = chamadas.find((c) => c.metodo === 'POST').corpo.chaveIdempotencia;
  await f._submeter();
  const k2 = chamadas.filter((c) => c.metodo === 'POST')[1].corpo.chaveIdempotencia;
  assert.equal(k1, k2);
  assert.equal(f.els['#btn-adicionar'].disabled, false);
  statusGestor = 201;
});

console.log(`carteirasAdicionarAtivo.test.mjs ok (${casos} casos)`);
