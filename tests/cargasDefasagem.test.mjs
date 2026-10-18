import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
const { htmlAvisoDefasagem, AvisoDefasagem } = await import('../public/js/components/cargas/AvisoDefasagem.js');
const agora = new Date('2026-10-18T12:00:00Z');
assert.equal(htmlAvisoDefasagem([], agora), '');
assert.equal(htmlAvisoDefasagem([{ etapa: 'DFP', ultimoSucessoEm: null }], agora), '');
assert.equal(htmlAvisoDefasagem([{ etapa: 'IPE', ultimoSucessoEm: '2026-10-17T12:00:00Z' }], agora), '');
const html = htmlAvisoDefasagem([{ etapa: 'IPE', ultimoSucessoEm: '2026-10-01T12:00:00Z' }], agora);
assert.match(html, /Carga atrasada/);
assert.match(html, /Comunicados/);
assert.match(html, /href="#\/cargas"/);
for (const arquivo of ['pages/InicioPage.js', 'components/SaudeDosDados.js']) {
  const fonte = readFileSync(new URL(`../public/js/${arquivo}`, import.meta.url), 'utf8');
  assert.match(fonte, /<aviso-defasagem-cargas>/);
}
const originalFetch = globalThis.fetch;
try {
  const aviso = new AvisoDefasagem();
  aviso.isConnected = true;
  globalThis.fetch = async () => { throw new Error('offline'); };
  await aviso.afterRender();
  assert.match(aviso.innerHTML, /Atualidade das cargas indisponível/);
  let concluir;
  globalThis.fetch = () => new Promise(resolve => { concluir = resolve; });
  aviso.innerHTML = 'anterior';
  const pendente = aviso.afterRender();
  aviso.disconnectedCallback();
  concluir({ ok: true, text: async () => '[]' });
  await pendente;
  assert.equal(aviso.innerHTML, 'anterior');
} finally { globalThis.fetch = originalFetch; }
console.log('cargasDefasagem.test.mjs ok');
