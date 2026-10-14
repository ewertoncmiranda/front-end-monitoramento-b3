import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };
const listeners = new Map();
globalThis.document = {
  addEventListener: (nome, fn) => listeners.set(nome, fn),
  removeEventListener: (nome, fn) => { if (listeners.get(nome) === fn) listeners.delete(nome); },
};

const { BaseComponent } = await import('../../public/js/components/base/BaseComponent.js');
const { PainelCandles } = await import('../../public/js/components/painelCandles/PainelCandles.js');
const { SecaoGrafico } = await import('../../public/js/components/ficha360/secoes/SecaoGrafico.js');

class TesteRender extends BaseComponent {
  chamadas = 0;
  template() { return '<p>renderizado</p>'; }
  afterRender() { this.chamadas++; }
}

const base = new TesteRender();
base.connectedCallback();
assert.equal(base.innerHTML, '<p>renderizado</p>');
assert.equal(base.chamadas, 1);
base.render();
assert.equal(base.chamadas, 2);

const painel = new PainelCandles();
painel._simbolo = 'PETR4';
const graficoHtml = painel.templateGrafico([{ dataIso: '2026-10-13', fatorAjuste: 1 }]);
assert.match(graficoHtml, /data-range=/);
assert.match(graficoHtml, /<candle-chart><\/candle-chart>/);
assert.match(painel.template(), /painel-candles-abas/);

const secao = new SecaoGrafico();
secao.isConnected = true;
secao.contexto = { simbolo: 'PETR4' };
assert.match(secao.innerHTML, /<painel-candles simbolo="PETR4"><\/painel-candles>/);

let focado = null;
const grafico = { focarData: (dataIso) => { focado = dataIso; } };
secao.querySelector = () => ({ querySelector: () => grafico });
listeners.get('f360:destacar-data')({ detail: { simbolo: 'VALE3', dataIso: '2026-10-13' } });
assert.equal(focado, null, 'ignora evento de outro símbolo');
listeners.get('f360:destacar-data')({ detail: { simbolo: 'PETR4', dataIso: '2026-10-13' } });
assert.equal(focado, '2026-10-13');
secao.disconnectedCallback();
assert.equal(listeners.has('f360:destacar-data'), false);

console.log('painelCandles: BaseComponent render(), painel e evento f360:destacar-data passaram');
