// F360-PAI-1: manifesto (C5), rotas da ficha, redirecionamentos e HTML da pagina.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };

const manifesto = await import('../../public/js/components/ficha360/manifesto.js');
const rota = await import('../../public/js/components/ficha360/rotaFicha.js');
const { paginaDaRota } = await import('../../public/js/router.js');
const pagina = await import('../../public/js/pages/FichaAtivoPage.js');
const nav = await import('../../public/js/navegacao.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

await caso('manifesto: ordem fixa do C5, tag e caminho de cada secao', () => {
  assert.deepEqual(manifesto.SECOES.map((s) => s.id),
    ['cabecalho', 'decisao', 'grafico', 'valuation', 'fundamentos', 'proventos', 'insiders', 'opcoes', 'eventos', 'operacao', 'ia']);
  assert.equal(manifesto.tagDaSecao('ia'), 'secao-ia');
  assert.equal(manifesto.caminhoDaSecao('ia'), './secoes/SecaoIa.js');
  assert.equal(manifesto.caminhoDaSecao('cabecalho'), './secoes/SecaoCabecalho.js');
});

await caso('secao ausente: import falha e carregarSecao devolve false sem lancar', async () => {
  const falha = async () => { throw new Error('404'); };
  assert.equal(await manifesto.carregarSecao('valuation', falha, () => true), false);
  assert.equal(await manifesto.carregarSecao('valuation', async () => ({}), () => false), false);
  const pedidos = [];
  assert.equal(await manifesto.carregarSecao('grafico', async (c) => pedidos.push(c), () => true), true);
  assert.deepEqual(pedidos, ['./secoes/SecaoGrafico.js']);
});

await caso('rota da ficha: simbolo, secao valida e lixo descartado', () => {
  assert.deepEqual(rota.rotaDaFicha('#/ativo/petr4?secao=grafico'), { simbolo: 'PETR4', secao: 'grafico' });
  assert.deepEqual(rota.rotaDaFicha('#/ativo/PETR4?secao=xpto'), { simbolo: 'PETR4', secao: null });
  assert.deepEqual(rota.rotaDaFicha('#/ativo'), { simbolo: '', secao: null });
  assert.equal(rota.rotaDaFicha('#/ativo/<script>').simbolo, '');
  assert.equal(rota.hashDaFicha('VALE3', 'ia'), '#/ativo/VALE3?secao=ia');
  assert.equal(rota.hashDaFicha('VALE3', 'xpto'), '#/ativo/VALE3');
});

await caso('redirecionamentos: ficha antiga, aba vira secao, #/ficha e #/candles', () => {
  assert.equal(rota.redirecionamento('#/gestao/PETR4'), '#/ativo/PETR4');
  assert.equal(rota.redirecionamento('#/ficha/vale3'), '#/ativo/VALE3');
  assert.equal(rota.redirecionamento('#/gestao/PETR4?aba=comunicados'), '#/ativo/PETR4?secao=eventos');
  assert.equal(rota.redirecionamento('#/gestao/PETR4?aba=operabilidade'), '#/ativo/PETR4?secao=operacao');
  assert.equal(rota.redirecionamento('#/ficha'), '#/ativo');
  assert.equal(rota.redirecionamento('#/gestao'), null);
  assert.equal(rota.redirecionamento('#/candles', { ultimo: 'PETR4', temGrafico: true }), '#/ativo/PETR4?secao=grafico');
  assert.equal(rota.redirecionamento('#/candles', { ultimo: 'PETR4', temGrafico: false }), null);
  assert.equal(rota.redirecionamento('#/candles', { ultimo: '', temGrafico: true }), null);
  assert.equal(rota.redirecionamento('#/inicio'), null);
});

await caso('ultimo ativo: le, grava e sobrevive a armazenamento indisponivel', () => {
  const mapa = new Map();
  const arm = { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, v) };
  rota.guardarUltimo('WEGE3', arm);
  assert.equal(mapa.get('b3.ficha.ultimo.v1'), 'WEGE3');
  assert.equal(rota.lerUltimo(arm), 'WEGE3');
  const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  assert.equal(rota.lerUltimo(quebrado), '');
  assert.doesNotThrow(() => rota.guardarUltimo('WEGE3', quebrado));
  assert.equal(rota.lerUltimo(null), '');
});

await caso('roteador: #/ativo e #/ativo/X abrem a ficha; demais rotas intactas', () => {
  assert.equal(paginaDaRota('#/ativo'), 'ficha-ativo-page');
  assert.equal(paginaDaRota('#/ativo/PETR4?secao=ia'), 'ficha-ativo-page');
  assert.equal(paginaDaRota('#/opcoes/PETR4'), 'opcao-page');
  assert.equal(paginaDaRota('#/gestao'), 'gestao-page');
  assert.equal(paginaDaRota('#/nada'), 'inicio-page');
});

await caso('menu: Ficha do ativo aponta para #/ativo, no grupo Ativos', () => {
  assert.ok(nav.rotasDoMenu().includes('#/ativo'));
  assert.equal(nav.grupoDaRota('#/ativo/PETR4'), 'ativos');
});

await caso('estrutura: topo fixo com cabecalho, ancoras sem cabecalho e um bloco por secao', () => {
  const html = pagina.htmlEstrutura('PETR4');
  assert.match(html, /class="f360-topo"[\s\S]*data-secao-id="cabecalho"/);
  for (const s of manifesto.SECOES.filter((x) => x.id !== 'cabecalho')) {
    assert.match(html, new RegExp(`id="f360-secao-${s.id}"`));
    assert.match(html, new RegExp(`data-ir-para="${s.id}"\\s+href="#/ativo/PETR4\\?secao=${s.id}"`));
  }
  assert.doesNotMatch(html, /data-ir-para="cabecalho"/);
});

await caso('sem ativo: seletor, ultimo visto escapado e link da tabela', () => {
  const html = pagina.htmlSemAtivo('VALE3');
  assert.match(html, /<seletor-de-ativos/);
  assert.match(html, /href="#\/ativo\/VALE3">VALE3</);
  assert.match(html, /href="#\/ativos"/);
  assert.doesNotMatch(pagina.htmlSemAtivo(''), /Último visto/);
});

await caso('em construcao escapa o rotulo', () => {
  assert.match(pagina.htmlEmConstrucao('<b>X</b>'), /Seção &lt;b&gt;X&lt;\/b&gt; em construção/);
});

console.log(`pagina: ${casos} casos`);
