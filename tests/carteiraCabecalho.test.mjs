// Cabecalho e resumo da carteira (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {
  innerHTML = '';
  querySelector = () => null;
  querySelectorAll = () => [];
};
globalThis.customElements = { define() {}, get() { return undefined; } };

const { CarteiraCabecalho, htmlResumo } = await import('../public/js/components/carteiras/CarteiraCabecalho.js');
const { avaliarPosicao, resumirCarteira } = await import('../public/js/analise/carteiraPosicao.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const pos = (simbolo, custo, preco, qtd) => avaliarPosicao({ simbolo, quantidade: qtd, custoTotal: custo, dataEntrada: '2026-01-01' }, { preco, dataPreco: '2026-10-20' });
const carteira = { id: 1, nome: 'Carteira <Teste>', estrategia: 'Dividendos', cor: '#3498db', criadaEm: '2026-01-01T00:00:00Z', ativos: [] };

function instancia() {
  const el = new CarteiraCabecalho();
  el.render = function render() { this.innerHTML = this.template(); };
  return el;
}

caso('sem carteira: skeleton; com carteira: nome escapado e estrategia', () => {
  const el = instancia();
  assert.match(el.template(), /placeholder/);
  el.setCarteira(carteira);
  assert.match(el.innerHTML, /Carteira &lt;Teste&gt;/);
  assert.match(el.innerHTML, /Dividendos/);
});

caso('resumo: custo, valor atual, resultado com sinal, melhor e pior, ativos, data do ultimo preco', () => {
  const r = resumirCarteira([pos('A1', 1000, 12, 100), pos('B1', 1000, 9, 100)]);
  const h = htmlResumo(r);
  assert.match(h, /data-kpi="investido">R\$ 2\.000,00/);
  assert.match(h, /data-kpi="valor-atual">R\$ 2\.100,00/);
  assert.match(h, /▲<\/span> \+R\$ 100,00 \(\+5,00%\)/);
  assert.match(h, /Melhor ativo[\s\S]*A1 \+20,00%/);
  assert.match(h, /Pior ativo[\s\S]*B1 −10,00%/);
  assert.match(h, /data-kpi="ativos">2/);
  assert.match(h, /preço de 20-10-2026/);
});

caso('proventos: sem dados omite; recebido e estimado aparecem separados e rotulados', () => {
  const r0 = resumirCarteira([pos('A1', 1000, 1000 / 100 * 1.1, 100)]);
  assert.doesNotMatch(htmlResumo(r0), /Proventos/);
  const r = resumirCarteira([pos('A1', 1000, 11, 100)], { proventosRecebidos: 50, proventosEstimados: 30 });
  const h = htmlResumo(r);
  assert.match(h, /Proventos recebidos[\s\S]*R\$ 50,00[\s\S]*yield on cost 5,00%/);
  assert.match(h, /Proventos estimados <span class="badge text-bg-warning">estimado<\/span>[\s\S]*R\$ 30,00/);
  assert.match(h, /Retorno total \(com recebidos\)[\s\S]*\+15,00%/);
  assert.match(h, /Retorno total com estimados[\s\S]*\+18,00%/);
});

caso('ativo sem cotacao: aviso e valores em traco, nunca zero', () => {
  const r = resumirCarteira([pos('A1', 1000, null, 100)]);
  const h = htmlResumo(r);
  assert.match(h, /data-kpi="valor-atual">-/);
  assert.match(h, /1 ativo\(s\) sem cotação/);
});

caso('setResumo redesenha o cabecalho com os indicadores', () => {
  const el = instancia();
  el.setCarteira(carteira);
  el.setResumo(resumirCarteira([pos('A1', 1000, 12, 100)]));
  assert.match(el.innerHTML, /data-kpi="investido"/);
});

console.log(`\n  ${casos} casos passaram.`);
