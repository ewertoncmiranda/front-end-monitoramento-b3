import assert from 'node:assert/strict';
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };
const L = await import('../../public/js/analise/ficha360/insiders.js');
const S = await import('../../public/js/components/ficha360/secoes/SecaoInsiders.js');
const { SECOES, secaoValida } = await import('../../public/js/components/ficha360/manifesto.js');
const { rotaDaChave } = await import('../../public/js/api/ficha360Api.js');
let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const ag = (q, v, m) => ({ quantidadeCompras: 10, quantidadeVendas: 0, compraLiquidaQuantidade: q, compraLiquidaVolume: v, movimentacoes: m });
const dto = { simbolo: 'PETR4', disponivel: true, sinal: 'COMPRA_LIQUIDA', leitura: 'Diretores compraram.',
  dataEntregaMaisRecente: '2026-10-01', dataUltimaMovimentacao: '2026-09-28',
  janelas: [{ meses: 12, total: ag(100, null, 5), porCargo: {} },
    { meses: 3, total: ag(-50, 1000, 2), porCargo: { Zeta: ag(1, 1, 1), Diretor: ag(-50, 1000, 2) } }] };

await caso('manifesto e rotas', () => {
  assert.ok(secaoValida('insiders'));
  const ids = SECOES.map((s) => s.id);
  assert.equal(ids.indexOf('insiders'), ids.indexOf('proventos') + 1);
  assert.equal(rotaDaChave('insiders', 'PETR4'), '/ativos/PETR4/insiders');
  assert.equal(rotaDaChave('recompras', 'PETR4'), '/ativos/PETR4/recompras');
});
await caso('selo e estado', () => {
  assert.equal(L.seloDoSinal('VENDA_LIQUIDA').texto, 'Venda líquida');
  assert.equal(L.seloDoSinal('xx').texto, 'Neutro');
  assert.equal(L.estadoDados(null).ok, false);
  assert.equal(L.estadoDados({ disponivel: false, motivo: 'sem dados' }).motivo, 'sem dados');
  assert.equal(L.estadoDados(dto).ok, true);
});
await caso('janelas ordenadas, cargos canonicos primeiro, volume ausente = null', () => {
  const j = L.janelasInsiders(dto);
  assert.deepEqual(j.map((x) => x.meses), [3, 12]);
  assert.deepEqual(j[0].cargos.map((c) => c.rotulo), ['Diretor', 'Zeta']);
  assert.equal(j[1].total.compraLiquidaVolume, null);
  const b = L.barrasPorJanela(j);
  assert.equal(b[0].sentido, 'venda'); assert.equal(b[1].proporcao, 1); assert.equal(b[0].proporcao, 0.5);
});
await caso('serie de recompras ordena e normaliza', () => {
  const s = L.serieRecompras({ serie: [{ dataBase: '2026-06-30', saldo: '-5', recompraLiquida: 2 }, { dataBase: '2026-03-31', saldo: -3 }] });
  assert.equal(s[0].dataBase, '2026-03-31'); assert.equal(s[1].saldo, -5); assert.equal(s[0].recompraLiquida, null);
});
await caso('render completo: selo, tabela, svg acessivel, avisos', () => {
  const h = S.htmlSecao(dto, { disponivel: true, recompraLiquida12m: 500, serie: [{ dataBase: '2026-06-30', tipoDoc: 'ITR', saldo: -5, recompraLiquida: 2 }] });
  for (const t of ['Compra líquida', 'data-sinal="COMPRA_LIQUIDA"', 'Dado vale a partir da entrega', '<svg', 'role="img"', 'cancelamento', 'sinal de confirmação', 'Últimos 3 meses', 'Diretor']) assert.ok(h.includes(t), t);
});
await caso('503/indisponivel: estado vazio discreto com motivo, sem quebrar', () => {
  const h = S.htmlSecao(null, { disponivel: false, motivo: 'Sem V45' });
  assert.ok(h.includes('data-vazio="insiders"')); assert.ok(h.includes('Sem V45')); assert.ok(!h.includes('<svg'));
  assert.ok(S.htmlSecao({ disponivel: false, motivo: '<b>x' }, null).includes('&lt;b&gt;x'));
});
console.log(`fontes_insiders: ${casos} casos`);
