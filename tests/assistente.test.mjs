// Tela "Assistente" (TASK-CHAT-4): rota, menu e conteudo.
import assert from 'node:assert/strict';

const listeners = {};
const outlet = { innerHTML: '' };
globalThis.window = {
  location: { hash: '#/assistente' },
  addEventListener(tipo, callback) { listeners[tipo] = callback; },
};
globalThis.document = { querySelector: () => outlet };
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const { iniciarRouter } = await import('../public/js/router.js');
const { GRUPOS, grupoDaRota, rotaAtiva, rotasDoMenu } = await import('../public/js/navegacao.js');
const { htmlAssistente, SUGESTOES_GERAIS } = await import('../public/js/pages/AssistentePage.js');

caso('a rota #/assistente abre a pagina', () => {
  iniciarRouter('#app');
  assert.equal(outlet.innerHTML, '<assistente-page></assistente-page>');
});

caso('item de menu existe e fica ativo na rota', () => {
  assert.ok(rotasDoMenu().includes('#/assistente'));
  assert.equal(grupoDaRota('#/assistente'), 'assistente');
  assert.equal(rotaAtiva('#/assistente'), '#/assistente');
  assert.ok(GRUPOS.some((g) => g.id === 'assistente' && g.rotulo === 'Assistente'));
});

caso('chat geral (sem simbolo) com as tres sugestoes', () => {
  const html = htmlAssistente();
  assert.match(html, /<chat-ia sugestoes="/);
  assert.doesNotMatch(html, /<chat-ia[^>]*simbolo=/);
  for (const s of SUGESTOES_GERAIS) assert.ok(html.includes(s), s);
  assert.equal(SUGESTOES_GERAIS.length, 3);
});

caso('explica o que faz e o que nao faz, com aviso regulatorio', () => {
  const html = htmlAssistente();
  assert.match(html, /Não recomenda/);
  assert.match(html, /dados públicos/);
  assert.match(html, /Não é recomendação de investimento/);
});

console.log(`assistente: ${casos} casos ok`);
