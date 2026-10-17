// Plano OPCX: sidebar de contexto, layout e integracao na tela de opcoes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };

const { htmlContextoOpcoes, AtivoContextoOpcoes } = await import('../public/js/components/opcoes/AtivoContextoOpcoes.js');
const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const completo = {
  precoAtual: 38.42, variacaoDia: 0.0123, max63d: 41.1, min63d: 34.2, posicaoRange: 0.6116,
  variacaoPeriodo: -0.034, graham: 46.15, recomendacao: 'COMPRA_FORTE', margem: 16.8,
  vol21d: 0.287, atr14: 0.92, volRelativo: 1.37,
  exDividendos: [
    { data: '2026-10-20', tipo: 'JCP', valor: 0.4512 },
    { data: '2026-11-03', tipo: 'Dividendo', valor: 1.1 },
    { data: '2026-11-20', tipo: 'Dividendo', valor: 0.2 },
    { data: '2026-12-01', tipo: 'Quarto não aparece', valor: 0.1 },
  ],
};

// --- OPCX-PAI-1 -------------------------------------------------------------------------
await caso('contexto completo: bloco 1 com preco, variacoes, maxima, minima e barra', () => {
  const html = htmlContextoOpcoes(completo);
  assert.match(html, /Preço e range[\s\S]*Valor e risco/);
  assert.match(html, /R\$ 38,42/);
  assert.match(html, /▲ \+1,23%/);
  assert.match(html, /Máxima 63d<\/dt><dd>R\$ 41,10/);
  assert.match(html, /Mínima 63d<\/dt><dd>R\$ 34,20/);
  assert.match(html, /aria-valuenow="61"[\s\S]*width:61%/);
  assert.match(html, /▼ -3,4%/);
});

await caso('contexto completo: bloco 2 com Graham, badge, margem, vol, ATR, volume e ex-dividendos', () => {
  const html = htmlContextoOpcoes(completo);
  assert.match(html, /Graham Number<\/dt><dd>R\$ 46,15/);
  assert.match(html, /badge bg-success">COMPRA FORTE</);
  assert.match(html, /Margem de segurança<\/dt><dd>16,8%/);
  assert.match(html, /Volatilidade 21d<\/dt><dd>28,7%/);
  assert.match(html, /ATR 14<\/dt><dd>R\$ 0,92/);
  assert.match(html, /Volume relativo<\/dt><dd>1,37×/);
  assert.match(html, /20-10-2026 JCP · R\$ 0,4512/);
  assert.doesNotMatch(html, /Quarto não aparece/);
});

await caso('tudo null: todos os campos viram traco, nenhum zero, sem lancar', () => {
  const nulos = Object.fromEntries(Object.keys(completo).map((k) => [k, null]));
  for (const ctx of [nulos, {}, null, undefined]) {
    const html = htmlContextoOpcoes(ctx);
    const valores = [...html.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((m) => m[1].trim());
    assert.equal(valores.length, 12);
    assert.ok(valores.every((v) => v === '—'), `campos: ${valores.join(' | ')}`);
    assert.match(html, /opc-ctx-range"><span class="text-body-secondary">—<\/span>/);
    assert.doesNotMatch(html, /R\$ 0,00|0,0%|NaN|undefined/);
  }
});

await caso('posicao fora de 0..1 fica presa na barra; texto externo escapado', () => {
  assert.match(htmlContextoOpcoes({ posicaoRange: 1.4 }), /width:100%/);
  assert.match(htmlContextoOpcoes({ posicaoRange: -0.2 }), /width:0%/);
  const html = htmlContextoOpcoes({ recomendacao: '<b>X</b>', exDividendos: [{ data: '2026-10-20', tipo: '<img>', valor: 1 }] });
  assert.doesNotMatch(html, /<b>X<\/b>|<img>/);
});

await caso('componente: setContexto desenha; sem contexto desenha tracos', () => {
  const el = new AtivoContextoOpcoes();
  el.setContexto(completo);
  assert.match(el.innerHTML, /R\$ 38,42/);
  el.setContexto(null);
  assert.match(el.innerHTML, /Preço atual<\/dt><dd>—/);
});

// --- OPCX-PAI-2 -------------------------------------------------------------------------
await caso('css: secao OPCOES LAYOUT no fim do app.css com as tres classes e o breakpoint', () => {
  const css = ler('public/css/app.css');
  const inicio = css.indexOf('/* === OPCOES LAYOUT === */');
  assert.ok(inicio > 0, 'secao ausente');
  const secao = css.slice(inicio);
  assert.match(secao, /\.opcoes-layout \{ display: flex; gap: 1rem; align-items: flex-start; \}/);
  assert.match(secao, /\.opcoes-sidebar \{ width: 260px; flex-shrink: 0; position: sticky; top: 1rem; \}/);
  assert.match(secao, /\.opcoes-principal \{ flex: 1; min-width: 0; \}/);
  assert.match(secao, /@media \(max-width: 767px\) \{[\s\S]*\.opcoes-layout \{ flex-direction: column;[\s\S]*\.opcoes-sidebar \{ width: 100%; position: static; \}/);
});

// --- OPCX-PAI-3 -------------------------------------------------------------------------
const { OpcaoPage } = await import('../public/js/pages/OpcaoPage.js');

await caso('pagina sem ativo: seletor, resultado vazio e saude num details aberto no rodape', () => {
  const html = new OpcaoPage().template();
  assert.match(html, /<seletor-de-ativos[\s\S]*id="opcao-resultado"[\s\S]*<details id="opcao-saude-detalhes"[^>]*open>/);
  assert.match(html, /<summary[^>]*>Saúde da cadeia de opções<\/summary>[\s\S]*id="opcao-saude"/);
  assert.doesNotMatch(html, /ativo-contexto-opcoes/);
});

function elementosFalsos() {
  const chamadas = [];
  const painel = { setDados: (d) => chamadas.push(['painel', d]) };
  const contexto = { setContexto: (c) => chamadas.push(['contexto', c]) };
  const resultado = {
    innerHTML: '',
    querySelector: (s) => ({ 'opcoes-painel': painel, 'ativo-contexto-opcoes': contexto }[s] ?? null),
  };
  return { chamadas, resultado };
}

await caso('com ativo: sidebar antes da area principal, dentro do layout de duas colunas', () => {
  const pagina = new OpcaoPage();
  pagina._contexto = completo;
  const { chamadas, resultado } = elementosFalsos();
  pagina._renderizar(resultado, 'PETR4', { simbolo: 'PETR4', vencimentos: [], opcoes: [], contexto: completo }, null);
  assert.match(resultado.innerHTML,
    /<div class="opcoes-layout">\s*<aside class="opcoes-sidebar"><ativo-contexto-opcoes><\/ativo-contexto-opcoes><\/aside>\s*<div class="opcoes-principal">[\s\S]*<opcoes-painel><\/opcoes-painel>/);
  assert.deepEqual(chamadas.map(([quem]) => quem), ['painel', 'contexto']);
  assert.equal(chamadas[1][1], completo);
});

await caso('abrir um ativo recolhe a saude da cadeia', async () => {
  const pagina = new OpcaoPage();
  let removido = null;
  const detalhes = { removeAttribute: (a) => { removido = a; } };
  const resultado = { innerHTML: '' };
  pagina.querySelector = (s) => ({ '#opcao-resultado': resultado, '#opcao-saude-detalhes': detalhes }[s] ?? null);
  globalThis.history = { replaceState() {} };
  await pagina._abrir('PETR4').catch(() => {});
  assert.equal(removido, 'open');
});

console.log(`opcx: ${casos} casos`);
