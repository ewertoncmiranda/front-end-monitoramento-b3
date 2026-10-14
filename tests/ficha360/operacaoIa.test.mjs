// F360-PAI-10: secoes Operacao e IA reaproveitam os componentes existentes.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { htmlOperacao, SecaoOperacao } = await import('../../public/js/components/ficha360/secoes/SecaoOperacao.js');
const { htmlIa, SecaoIa } = await import('../../public/js/components/ficha360/secoes/SecaoIa.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

await caso('operacao: componente reaproveitado com o simbolo e atalhos', () => {
  const html = htmlOperacao('PETR4');
  assert.match(html, /<operabilidade-ativo simbolo="PETR4"><\/operabilidade-ativo>/);
  assert.match(html, /href="#\/simulador"[^>]*>Simular PETR4/);
  assert.match(html, /href="#\/operabilidade"/);
});

await caso('ia: componente reaproveitado com o simbolo', () => {
  assert.equal(htmlIa('VALE3'), '<ativo-ia simbolo="VALE3"></ativo-ia>');
});

await caso('simbolo escapado nos atributos', () => {
  assert.doesNotMatch(htmlOperacao('"><x'), /"><x/);
  assert.doesNotMatch(htmlIa('"><x'), /"><x/);
});

await caso('contexto chega depois de conectado: renderiza; antes: vazio', () => {
  for (const Classe of [SecaoOperacao, SecaoIa]) {
    const secao = new Classe();
    assert.equal(secao.template(), '');
    secao.isConnected = true;
    secao.contexto = { simbolo: 'WEGE3', obter: async () => null };
    assert.match(secao.innerHTML, /simbolo="WEGE3"/);
    assert.equal(secao.contexto.simbolo, 'WEGE3');
  }
});

console.log(`operacaoIa: ${casos} casos`);
