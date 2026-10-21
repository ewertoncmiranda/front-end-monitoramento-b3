// MACRO-PAI-4: verbetes do Glossario e formulas dos planos MACRO, FONTES e MICRO.
// Garante que tudo existe, que os ids sao unicos e que todo link interno cai
// numa rota real do painel.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };

const { GLOSSARIO, GlossarioPage } = await import('../../public/js/pages/GlossarioPage.js');
const { TEMAS, FormulasPage } = await import('../../public/js/pages/FormulasPage.js');
const { paginaDaRota } = await import('../../public/js/router.js');
const { SECOES } = await import('../../public/js/components/ficha360/manifesto.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const verbetes = GLOSSARIO.flatMap((g) => g.termos);
const porId = new Map(verbetes.filter((v) => v.id).map((v) => [v.id, v]));
const formulas = TEMAS.flatMap((t) => t.itens);
const formulaPorId = new Map(formulas.filter((i) => i.id).map((i) => [i.id, i]));

const VERBETES_ESPERADOS = [
  'juro-real', 'ciclo-selic', 'barreira-compra', 'expectativas-focus', 'ipca-12m', 'curva-ntnb',
  'premio-risco', 'graham-ajustado', 'basileia', 'capital-principal', 'inadimplencia', 'roe', 'pvp',
  'roe-banco', 'pvp-banco', 'roe-sobre-pvp', 'compra-liquida-insiders', 'recompra-liquida', 'data-ex',
  'ajuste-implicito', 'yield-evento', 'preco-medio-dia', 'melhor-oferta', 'spread', 'spread-ofertas',
  'preco-justo-spread', 'strike-corrigido', 'defasagem-ultimo-negocio', 'custo-execucao', 'alvo-liquido',
  'selos-confiabilidade', 'selo-cadastro', 'selo-auditor', 'selo-divida', 'selo-fundos', 'selo-dividendo',
];

const FORMULAS_ESPERADAS = [
  'juro-real', 'barreira-compra', 'ciclo-selic', 'ipca-12m', 'referencia-ntnb', 'premio-risco',
  'graham-ajustado-juro', 'banco-basileia', 'banco-inadimplencia', 'banco-roe-selic', 'roe-sobre-pvp',
  'compra-liquida', 'recompra-liquida', 'selo-divida', 'selo-dividendo', 'selo-auditor-cadastro',
  'ajuste-implicito', 'yield-evento', 'alerta-data-ex', 'custo-execucao', 'preco-justo-spread',
  'spread-pct', 'defasagem-ultimo-negocio', 'strike-corrigido',
];

caso('glossario: todo verbete esperado existe com definicao, como ler e onde aparece', () => {
  for (const id of VERBETES_ESPERADOS) {
    const v = porId.get(id);
    assert.ok(v, `verbete ausente: ${id}`);
    assert.ok(v.termo && v.definicao, `${id}: sem termo ou definicao`);
    assert.ok(v.comoLer, `${id}: sem "como ler"`);
    assert.ok(v.link && v.link.href.startsWith('#/'), `${id}: sem link interno`);
    if (!['roe', 'pvp', 'spread'].includes(id)) assert.ok(v.onde, `${id}: sem "onde aparece"`);
  }
});

caso('glossario: ids unicos e sem verbete duplicado no HTML', () => {
  const ids = verbetes.filter((v) => v.id).map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos em GLOSSARIO');
  const html = new GlossarioPage().template();
  const noHtml = [...html.matchAll(/id="verbete-([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(noHtml).size, noHtml.length, 'ids repetidos no HTML');
  for (const id of VERBETES_ESPERADOS) assert.ok(noHtml.includes(id), `${id} nao renderizado`);
  assert.match(html, /Como ler:/);
});

caso('formulas: toda formula esperada existe com expressao, variaveis, exemplo e limites', () => {
  for (const id of FORMULAS_ESPERADAS) {
    const i = formulaPorId.get(id);
    assert.ok(i, `formula ausente: ${id}`);
    for (const campo of ['nome', 'formula', 'variaveis', 'exemplo', 'limites']) {
      assert.ok(i[campo], `${id}: sem ${campo}`);
    }
  }
});

caso('formulas: ids unicos por item e por tema, e render com todos eles', () => {
  const ids = formulas.filter((i) => i.id).map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'ids de formula repetidos');
  const temas = TEMAS.map((t) => t.id);
  assert.equal(new Set(temas).size, temas.length, 'ids de tema repetidos');
  const html = new FormulasPage().template();
  const noHtml = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(noHtml).size, noHtml.length, 'ids repetidos no HTML das formulas');
  for (const id of FORMULAS_ESPERADAS) assert.ok(noHtml.includes(`f-${id}`), `${id} nao renderizado`);
});

caso('formulas: expressoes pedidas pelo plano estao escritas como combinado', () => {
  const f = (id) => formulaPorId.get(id).formula;
  assert.match(f('juro-real'), /\(1 \+ Selic\) \/ \(1 \+ IPCA esperado\) - 1/);
  assert.match(f('barreira-compra'), /barreira = Selic meta/);
  assert.match(f('premio-risco'), /earnings yield - juro real da NTN-B de referência \(vencimento mais perto de 5 anos\)/);
  assert.match(f('graham-ajustado-juro'), /V x 4,4 \/ Y/);
  assert.match(f('roe-sobre-pvp'), /ROE \/ P\/VP/);
  assert.match(f('compra-liquida'), /\(compras - vendas\) \/ \(compras \+ vendas\)/);
  assert.match(f('recompra-liquida'), /-\(saldo de tesouraria no fim - saldo no início\)/);
  assert.match(f('ajuste-implicito'), /fechamento do pregão anterior - abertura do dia ex/);
  assert.match(f('yield-evento'), /valor declarado \/ fechamento anterior/);
  assert.match(f('preco-justo-spread'), /\(melhor compra \+ melhor venda\) \/ 2/);
  assert.match(f('spread-pct'), /\(venda - compra\) \/ preço justo x 100/);
});

caso('limiares reais citados: Basileia 10,5, +0,5 p.p., 0,10 em 6 meses, 10 dias, 10%', () => {
  const texto = (v) => `${v.definicao} ${v.comoLer}`;
  assert.match(texto(porId.get('basileia')), /10,5%/);
  assert.match(texto(porId.get('inadimplencia')), /0,5 ponto percentual em 4 trimestres/);
  assert.match(texto(porId.get('inadimplencia')), /constante revisável/);
  assert.match(texto(porId.get('compra-liquida-insiders')), /0,10/);
  assert.match(texto(porId.get('compra-liquida-insiders')), /6 meses/);
  assert.match(texto(porId.get('data-ex')), /10 dias/);
  assert.match(texto(porId.get('defasagem-ultimo-negocio')), /10%/);
  assert.match(formulaPorId.get('banco-basileia').formula, /10,5%/);
  assert.match(formulaPorId.get('banco-inadimplencia').limites, /constante revisável/);
  assert.match(formulaPorId.get('compra-liquida').limites, /constantes revisáveis/);
});

caso('exemplos numericos conferem com as contas', () => {
  const premio = 12.5 - 7.2;
  assert.equal(premio.toFixed(2), '5.30');
  assert.equal((78.75 * 4.4 / 14.5).toFixed(2), '23.90');
  assert.equal(((1.145 / 1.0522 - 1) * 100).toFixed(2), '8.82');
  assert.equal((21.5 / 2).toFixed(2), '10.75');
  assert.equal(((1000 - 200) / (1000 + 200)).toFixed(2), '0.67');
  assert.equal((42.37 - 41.90).toFixed(2), '0.47');
  assert.equal(((42.37 - 41.90) / 42.37 * 100).toFixed(2), '1.11');
  assert.equal((0.5 / 42.37 * 100).toFixed(2), '1.18');
  assert.equal(((2.10 - 1.90) / ((1.90 + 2.10) / 2) * 100).toFixed(0), '10');
  assert.match(formulaPorId.get('premio-risco').exemplo, /\+5,30 p\.p\./);
  assert.match(formulaPorId.get('graham-ajustado-juro').exemplo, /23,90/);
  assert.match(formulaPorId.get('roe-sobre-pvp').exemplo, /10,75/);
});

// Insiders so existe na ficha depois da integracao da FONTES-PAI-3 (cons-painel-f3).
const SECOES_PENDENTES_DE_INTEGRACAO = new Set(['insiders']);

function validarHref(href, origem) {
  assert.ok(href.startsWith('#/'), `${origem}: link nao interno: ${href}`);
  const [caminho, consulta = ''] = href.split('?');
  const rota = paginaDaRota(caminho);
  if (caminho !== '#/inicio') assert.notEqual(rota, 'inicio-page', `${origem}: rota inexistente: ${href}`);
  const secao = new URLSearchParams(consulta).get('secao');
  if (secao) {
    assert.equal(caminho, '#/ativo', `${origem}: secao so vale em #/ativo`);
    const existe = SECOES.some((s) => s.id === secao) || SECOES_PENDENTES_DE_INTEGRACAO.has(secao);
    assert.ok(existe, `${origem}: secao inexistente: ${secao}`);
  }
}

caso('todo link interno dos verbetes novos e uma rota real', () => {
  for (const id of VERBETES_ESPERADOS) validarHref(porId.get(id).link.href, id);
});

caso('todo link interno das paginas (glossario e formulas) e uma rota real', () => {
  for (const html of [new GlossarioPage().template(), new FormulasPage().template()]) {
    for (const m of html.matchAll(/href="(#\/[^"]*)"/g)) {
      // Links de padrao do proprio glossario (?padrao=) levam parametro da pagina.
      validarHref(m[1], 'pagina');
    }
  }
});

caso('sem aconselhamento: nenhum texto novo manda comprar, vender ou promete retorno', () => {
  const textos = [
    ...VERBETES_ESPERADOS.map((id) => porId.get(id)).flatMap((v) => [v.definicao, v.comoLer]),
    ...FORMULAS_ESPERADAS.map((id) => formulaPorId.get(id)).flatMap((i) => [i.descricao, i.limites]),
  ].join(' ');
  assert.doesNotMatch(textos, /\b(compre|venda agora|recomendamos|vale a pena comprar|retorno garantido|lucro garantido)\b/i);
});

caso('portugues: acentos preservados nos textos novos', () => {
  const textos = VERBETES_ESPERADOS.map((id) => porId.get(id).definicao).join(' ');
  assert.match(textos, /[çãõé]/);
  assert.doesNotMatch(textos, /Ã.|Â.|�/);
});

console.log(`\n${casos} casos ok`);
