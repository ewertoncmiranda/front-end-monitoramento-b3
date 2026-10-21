// Card e linha de ativo da carteira (CARTEIRAS-CARDS).
import assert from 'node:assert/strict';

globalThis.HTMLElement = class { innerHTML = ''; querySelector = () => null; };
globalThis.customElements = { define() {}, get() { return undefined; } };

const { htmlCardAtivo, htmlLinhaAtivo, infoResultado } = await import('../public/js/components/carteiras/CarteiraCardAtivo.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

const base = {
  simbolo: 'PETR4', legado: false, quantidade: 100, precoMedio: 30, custoTotal: 3000, dataEntrada: '2026-10-01', dias: 20,
  precoAtual: 33, dataPreco: '2026-10-20', valorAtual: 3300, resultado: 300, resultadoPct: 0.1, participacao: 0.5, setor: 'Petróleo e Gás',
  serie: [{ dataIso: '2026-10-01', preco: 30 }, { dataIso: '2026-10-20', preco: 33 }],
};

caso('card mostra ticker com link, setor, quantidade, preco medio, entrada com dias, preco atual com data e valor', () => {
  const h = htmlCardAtivo(base);
  assert.match(h, /href="#\/ativo\/PETR4"/);
  assert.match(h, /Petróleo e Gás/);
  assert.match(h, /data-campo="quantidade">100</);
  assert.match(h, /data-campo="preco-medio">R\$ 30,00/);
  assert.match(h, /01-10-2026 \(20 dias\)/);
  assert.match(h, /R\$ 33,00 <span[^>]*>\(20-10-2026\)/);
  assert.match(h, /data-campo="valor-atual">R\$ 3\.300,00/);
  assert.match(h, /f360-sparkline/);
});

caso('valorizacao: seta, sinal textual e rotulo (nao so cor)', () => {
  const h = htmlCardAtivo(base);
  assert.match(h, /text-success/);
  assert.match(h, /▲/);
  assert.match(h, /\+R\$ 300,00/);
  assert.match(h, /\+10,00%/);
  assert.match(h, /Valorização/);
});

caso('perda: seta para baixo, sinal menos e rotulo Perda', () => {
  const r = infoResultado(-150, -0.05);
  assert.equal(r.seta, '▼');
  assert.equal(r.rotulo, 'Perda');
  assert.match(r.texto, /^−R\$ 150,00/);
  assert.equal(r.textoPct, '−5,00%');
  assert.match(htmlCardAtivo({ ...base, resultado: -150, resultadoPct: -0.05 }), /text-danger/);
});

caso('sem cotacao: traços e nunca zero; sem sparkline omite', () => {
  const h = htmlCardAtivo({ ...base, precoAtual: null, dataPreco: null, valorAtual: null, resultado: null, resultadoPct: null, serie: [], participacao: null });
  assert.match(h, /sem cotação/);
  assert.match(h, /data-campo="valor-atual">-</);
  assert.doesNotMatch(h, /f360-sparkline/);
});

caso('barra de participacao acessivel e aviso de concentracao', () => {
  const h = htmlCardAtivo({ ...base, participacao: 0.45, concentrado: true, limiteConcentracao: 0.3 });
  assert.match(h, /role="progressbar"[^>]*aria-valuenow="45"/);
  assert.match(h, /45,0%/);
  assert.match(h, /Concentração alta: acima de 30,00%|Concentração alta: acima de 30%/);
});

caso('menu de acoes: comprar, vender, estornar', () => {
  const h = htmlCardAtivo(base);
  for (const a of ['comprar', 'vender', 'estornar']) assert.match(h, new RegExp(`data-acao="${a}" data-simbolo="PETR4"`));
});

caso('legado: aviso, sem quantidade, converter so se couber', () => {
  const l = { ...base, legado: true, quantidade: null, precoMedio: null, capital: 1000, podeConverter: true };
  const h = htmlCardAtivo(l);
  assert.match(h, /Legado \(capital\)/);
  assert.match(h, /data-acao="converter"/);
  assert.doesNotMatch(h, /data-acao="vender"/);
  assert.doesNotMatch(htmlCardAtivo({ ...l, podeConverter: false }), /data-acao="converter"/);
});

caso('proventos: recebido sem selo; estimado com selo e yield on cost', () => {
  assert.doesNotMatch(htmlCardAtivo({ ...base, proventos: { tipo: 'recebido', total: 80, yieldOnCost: 0.02 } }), /estimado/);
  const e = htmlCardAtivo({ ...base, proventos: { tipo: 'estimado', total: 50, yieldOnCost: 0.0167 } });
  assert.match(e, /Proventos estimados <span class="badge text-bg-warning">estimado/);
  assert.match(e, /yield on cost 1,67%/);
});

caso('escapa texto externo e skeleton enquanto carrega', () => {
  assert.doesNotMatch(htmlCardAtivo({ ...base, setor: '<img src=x>' }), /<img/);
  assert.match(htmlCardAtivo({}, { carregando: true }), /aria-busy="true"/);
});

caso('linha da tabela compacta traz os mesmos dados', () => {
  const h = htmlLinhaAtivo(base);
  assert.match(h, /PETR4/);
  assert.match(h, /▲<\/span> \+R\$ 300,00 \(\+10,00%\)/);
  assert.match(htmlLinhaAtivo({ ...base, legado: true }), /legado \(capital\)/);
});

console.log(`carteirasCard.test.mjs ok (${casos} casos)`);
