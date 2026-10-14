// F360-PAI-12: aba Cadastro removida; favoritar continua pela estrela.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const raiz = new URL('../../', import.meta.url);
const ler = (caminho) => readFileSync(new URL(caminho, raiz), 'utf8');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

await caso('CadastroPage removida e ninguem a importa', () => {
  assert.equal(existsSync(new URL('public/js/pages/CadastroPage.js', raiz)), false);
  for (const arquivo of ['public/js/main.js', 'public/js/router.js', 'public/js/pages/GestaoPage.js']) {
    assert.doesNotMatch(ler(arquivo), /CadastroPage|cadastro-page/, arquivo);
  }
});

await caso('GestaoPage sem abas: so a ficha classica e o atalho para a ficha nova', async () => {
  const { GestaoPage } = await import('../../public/js/pages/GestaoPage.js');
  const html = new GestaoPage().template();
  assert.match(html, /<consulta-page><\/consulta-page>/);
  assert.match(html, /href="#\/ativo"/);
  assert.doesNotMatch(html, /Cadastro|data-bs-toggle="tab"/);
});

await caso('menu sem entrada de cadastro', async () => {
  const { rotasDoMenu } = await import('../../public/js/navegacao.js');
  assert.ok(!rotasDoMenu().some((r) => /cadastro/i.test(r)));
});

await caso('favoritar segue disponivel pela estrela', () => {
  assert.match(ler('public/js/components/FavoritoToggle.js'), /favoritar\(this\.simbolo\)/);
});

await caso('README e SPEC nao apontam mais para a aba Cadastro', () => {
  assert.doesNotMatch(ler('README.md'), /#\/cadastro|CadastroPage\.js|aba Cadastro usa/);
  assert.match(ler('SPEC.md'), /\| #\/ativo, #\/ativo\/\{TICKER\}/);
});

console.log(`semCadastro: ${casos} casos`);
