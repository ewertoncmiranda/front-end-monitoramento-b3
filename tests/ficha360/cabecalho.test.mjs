// F360-PAI-2: cabecalho fixo da ficha.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { dadosDoCabecalho, precoDoCabecalho, htmlCabecalho, htmlSeloDaAcao } =
  await import('../../public/js/components/ficha360/secoes/SecaoCabecalho.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const vela = (data, fechamento, fonte = 'B3_COTAHIST') =>
  ({ data, abertura: fechamento, maxima: fechamento, minima: fechamento, fechamento, fonte });
const pregoes = { velas: [vela('2026-10-12', 38), vela('2026-10-13', 38.76)] };
const identidade = {
  simbolo: 'PETR4', cnpj: '33.000.167/0001-01', razao_social: 'PETROLEO BRASILEIRO S.A. PETROBRAS',
  isin: 'BRPETRACNPR6', cnae: '0600-0/01', situacao_registro: 'ATIVO', uf_municipio: 'RJ', free_float: 63.4,
};
const base = { simbolo: 'PETR4', nome: 'Petrobras', setor: 'Petróleo, Gás e Biocombustíveis', situacaoRegistro: 'ATIVO' };

await caso('junta identidade, base e pregoes; identidade vence no nome', () => {
  const d = dadosDoCabecalho('PETR4', { identidade, base, pregoes });
  assert.equal(d.nome, 'PETROLEO BRASILEIRO S.A. PETROBRAS');
  assert.equal(d.setor, 'Petróleo, Gás e Biocombustíveis');
  assert.equal(d.isin, 'BRPETRACNPR6');
  assert.equal(d.freeFloat, 63.4);
  assert.equal(d.preco.preco, 38.76);
  assert.equal(d.preco.fonte, 'B3_COTAHIST');
  assert.ok(Math.abs(d.preco.variacao - 2) < 1e-9);
});

await caso('sem identidade (gestor sem F360-GES-2): cai para base e cotacao', () => {
  const d = dadosDoCabecalho('PETR4', { base, ativo: { longName: 'Petrobras PN' }, pregoes });
  assert.equal(d.nome, 'Petrobras');
  assert.equal(d.isin, null);
  assert.equal(d.freeFloat, null);
  assert.equal(d.situacao, 'ATIVO');
});

await caso('preco intradiario mais novo que o pregao vence; mais antigo nao', () => {
  const velas = [{ dataIso: '2026-10-13', close: 38.76, fonte: 'B3_COTAHIST' }];
  const novo = precoDoCabecalho({ regularMarketPrice: 39.1, regularMarketChangePercent: 0.88, regularMarketTime: '2026-10-14T13:05:00Z' }, velas);
  assert.deepEqual(novo, { preco: 39.1, variacao: 0.88, data: '2026-10-14', fonte: 'BRAPI' });
  const velho = precoDoCabecalho({ regularMarketPrice: 37, regularMarketTime: '2026-10-10T13:00:00Z' }, velas);
  assert.equal(velho.preco, 38.76);
  assert.equal(precoDoCabecalho(null, []), null);
});

await caso('tudo nulo: tracos, nunca zero, e sem quebrar', () => {
  const html = htmlCabecalho(dadosDoCabecalho('XPTO3', {}));
  assert.match(html, /XPTO3/);
  assert.match(html, /Sem preço no banco/);
  assert.match(html, /ISIN —/);
  assert.match(html, /Free float —/);
  assert.doesNotMatch(html, /R\$ 0,00|0,0%/);
});

await caso('variacao com seta e cor: alta verde, baixa vermelha', () => {
  const alta = htmlCabecalho(dadosDoCabecalho('PETR4', { pregoes }));
  assert.match(alta, /var\(--f360-compra, #16a34a\)">▲ \+2,00%/);
  const queda = htmlCabecalho(dadosDoCabecalho('PETR4', { pregoes: { velas: [vela('2026-10-12', 40), vela('2026-10-13', 38)] } }));
  assert.match(queda, /var\(--f360-venda, #be123c\)">▼ -5,00%/);
});

await caso('mostra estrela, ISIN, CNPJ, free float e fonte do preco', () => {
  const html = htmlCabecalho(dadosDoCabecalho('PETR4', { identidade, base, pregoes }));
  assert.match(html, /<favorito-toggle simbolo="PETR4">/);
  assert.match(html, /ISIN BRPETRACNPR6/);
  assert.match(html, /CNPJ 33\.000\.167\/0001-01/);
  assert.match(html, /Free float 63,4%/);
  assert.match(html, /B3 oficial · 13-10-2026/);
});

await caso('selo da acao: so com plano, com icone e cor do C4', () => {
  assert.equal(htmlSeloDaAcao(null), '');
  assert.equal(htmlSeloDaAcao({ acao: 'QUALQUER' }), '');
  assert.match(htmlSeloDaAcao({ acao: 'COMPRAR', forca: 2 }), /--f360-compra-forte[\s\S]*▲ COMPRAR ●●/);
  assert.match(htmlSeloDaAcao({ acao: 'COMPRAR', forca: 1 }), /--f360-compra,[\s\S]*▲ COMPRAR ●</);
  assert.match(htmlSeloDaAcao({ acao: 'VENDER', forca: 1 }), /--f360-venda[\s\S]*▼ VENDER/);
  assert.match(htmlSeloDaAcao({ acao: 'MANTER', forca: 0 }), /■ MANTER</);
  assert.doesNotMatch(htmlSeloDaAcao({ acao: 'VENDER', forca: 2 }), /recomenda|educacional|não é/i);
});

await caso('texto externo escapado', () => {
  const html = htmlCabecalho(dadosDoCabecalho('PETR4', { identidade: { razao_social: '<img onerror=x>' } }));
  assert.match(html, /&lt;img onerror=x&gt;/);
  assert.doesNotMatch(html, /<img onerror/);
});

console.log(`cabecalho: ${casos} casos`);
