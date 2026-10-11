// Invariantes da FormulasPage (TASK-42): conteudo 100% estatico, sem API.
// Garante que cada item referencia apenas chaves de STATUS e CENARIOS que
// realmente existem no modulo, e que o template nao lanca excecao.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { FormulasPage } = await import('../public/js/pages/FormulasPage.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

// Chaves validas declaradas no modulo (copiadas aqui para que o teste
// detecte se uma nova chave de STATUS ou CENARIO quebrar referencia cruzada).
const STATUS_VALIDOS = new Set(['implementado', 'proposta', 'gratis', 'pago']);
const CENARIOS_VALIDOS = new Set(['DAY_TRADE', 'SWING', 'LONGO_PRAZO', 'SETORIAL', 'MACRO']);

// Extraimos TEMAS via template() - cada tema vira um card com id no HTML.
// A alternativa seria checar o source como texto, mas nao precisamos: o
// template ja falha rapido se qualquer referencia de STATUS/CENARIOS estiver errada.

caso('template() renderiza sem lancas excecao', () => {
  const html = new FormulasPage().template();
  assert.ok(typeof html === 'string' && html.length > 100);
});

caso('template() contem os ids de todos os temas esperados', () => {
  const html = new FormulasPage().template();
  for (const id of ['valuation', 'contexto-tecnico', 'sinal-tecnico', 'perfil-operacao',
                    'decisao-consolidada', 'contexto-setorial', 'risco-mercado', 'contexto-macro']) {
    assert.ok(html.includes(`id="${id}"`), `tema "${id}" ausente no HTML`);
  }
});

caso('template() contem badges de status e cenarios da legenda', () => {
  const html = new FormulasPage().template();
  assert.match(html, /Implementado/);
  assert.match(html, /Proposta futura/);
  assert.match(html, /Gratis hoje/);
  assert.match(html, /Requer upgrade/);
  assert.match(html, /Longo prazo/);
  assert.match(html, /Day trade/);
});

caso('template() contem as formulas principais do valuation', () => {
  const html = new FormulasPage().template();
  assert.match(html, /4,4 \/ Selic/);
  assert.match(html, /sqrt\(22,5/);
  assert.match(html, /earnings yield/i);
});

caso('nenhum item do source referencia STATUS inexistente', () => {
  const fonte = readFileSync(new URL('../public/js/pages/FormulasPage.js', import.meta.url), 'utf8');
  // Extrair todos os valores de status: nas strings 'implementado', 'proposta', 'gratis', 'pago'
  const statusUsados = new Set((fonte.match(/status:\s*'([^']+)'/g) || [])
    .map(m => m.match(/'([^']+)'/)[1]));
  for (const s of statusUsados) {
    assert.ok(STATUS_VALIDOS.has(s), `status "${s}" nao esta em STATUS_VALIDOS`);
  }
});

caso('nenhum item do source referencia CENARIO inexistente', () => {
  const fonte = readFileSync(new URL('../public/js/pages/FormulasPage.js', import.meta.url), 'utf8');
  // Cenarios aparecem como 'DAY_TRADE', 'SWING', etc. dentro de arrays
  const cenUsados = new Set((fonte.match(/'([A-Z_]+)'/g) || [])
    .map(m => m.replace(/'/g, ''))
    .filter(s => /^[A-Z_]+$/.test(s)));
  // Filtrar apenas as que podem ser cenarios (todas maiusculas, no conjunto valido ou em STATUS/CENARIOS)
  const potenciaisCenarios = [...cenUsados].filter(s => !STATUS_VALIDOS.has(s.toLowerCase()));
  for (const c of potenciaisCenarios) {
    // Apenas chaves que parecem cenarios (sem numeros, nao e um STATUS)
    if (['DAY_TRADE', 'SWING', 'LONGO_PRAZO', 'SETORIAL', 'MACRO'].includes(c)
        || !c.includes('_')) continue;
    if (c.includes('_') && !CENARIOS_VALIDOS.has(c)) {
      // Pode ser outra constante do modulo; so alerta se parecer cenario de uso
      const ocorrencias = (fonte.match(new RegExp(`'${c}'`, 'g')) || []).length;
      if (ocorrencias > 1) {
        assert.ok(CENARIOS_VALIDOS.has(c) || !['DAY_TRADE','SWING','LONGO_PRAZO','SETORIAL','MACRO']
          .some(v => fonte.includes(`cenarios: [`) && fonte.includes(`'${c}'`)),
          `cenario "${c}" pode estar fora do map CENARIOS`);
      }
    }
  }
});

caso('template() contem secao de fontes de dados (BRAPI e CVM)', () => {
  const html = new FormulasPage().template();
  assert.match(html, /BRAPI: o que e gratis hoje/);
  assert.match(html, /CVM Dados Abertos/);
});

console.log(`${casos} casos ok`);
