import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };
const dx = await import('../../public/js/analise/ficha360/datasEx.js');
const { montarPlano } = await import('../../public/js/analise/ficha360/planoDeOperacao.js');
const { htmlDatasEx } = await import('../../public/js/components/ficha360/secoes/SecaoProventos.js');
const { rotaDaChave, CHAVES_DO_CONTEXTO } = await import('../../public/js/api/ficha360Api.js');

const hoje = new Date(2026, 9, 21);
const dto = {
  origemDados: 'COTAHIST_AO_VIVO',
  eventos: [
    { dataEx: '2026-08-24', tipo: 'DIVIDENDO', ajusteImplicito: 1.7, ajustePercentual: 3.8, valorDeclarado: null, yieldDoEvento: null, razaoAjuste: null },
    { dataEx: '2025-12-23', tipo: 'DIVIDENDO', ajusteImplicito: 1.0, ajustePercentual: 2.2, valorDeclarado: 1.1, yieldDoEvento: 0.025, razaoAjuste: 0.91 },
    { dataEx: '2020-01-02', tipo: 'JCP', ajusteImplicito: 9, ajustePercentual: 9 },
  ],
  resumo: { quantidade12Meses: 2, proximaDataEstimada: '2026-10-28', proximoTipo: 'DIVIDENDO', confianca: 'MEDIA', leitura: 'Estimativa por sazonalidade.' },
};

function pregoes(extra = {}) {
  return Array.from({ length: 30 }, (_, i) => ({ max: 101 + Math.sin(i) * 0.1, min: 99, fechamento: 100 + Math.sin(i) * 0.1, ...extra }));
}
const base = () => ({ analise: { recomendacao: 'COMPRA_FORTE', preco_atual: 100 }, fundamentosCvm: { graham_number: 120 }, pregoes: pregoes(), backtest: null, opiniao: null, hoje });

test('rota e chave datasEx', () => {
  assert.ok(CHAVES_DO_CONTEXTO.includes('datasEx'));
  assert.equal(rotaDaChave('datasEx', 'PETR4'), '/ativos/PETR4/datas-ex');
});

test('alerta de data ex: dentro e fora da janela, com ajuste esperado', () => {
  const a = dx.alertaDataEx(dto, hoje);
  assert.equal(a.dias, 7);
  assert.equal(a.tipo, 'DIVIDENDO');
  assert.ok(Math.abs(a.ajusteEsperadoPct - 3.0) < 1e-9);
  assert.equal(dx.alertaDataEx({ ...dto, resumo: { ...dto.resumo, proximaDataEstimada: '2026-11-15' } }, hoje), null);
  assert.equal(dx.alertaDataEx({ ...dto, resumo: { ...dto.resumo, proximaDataEstimada: '2026-10-01' } }, hoje), null);
  assert.equal(dx.alertaDataEx(null, hoje), null);
  assert.equal(dx.DIAS_ALERTA_DATA_EX, 10);
});

test('spread de fechamento e custo mediano; sem oferta nao ha custo', () => {
  assert.ok(Math.abs(dx.spreadDaVela({ melhorOfertaCompra: 99.9, melhorOfertaVenda: 100.1 }) - 0.2) < 1e-9);
  assert.equal(dx.spreadDaVela({ melhorOfertaCompra: 100 }), null);
  assert.equal(dx.spreadDaVela({ melhorOfertaCompra: 101, melhorOfertaVenda: 100 }), null);
  const velas = [{ melhorOfertaCompra: 99.9, melhorOfertaVenda: 100.1 }, {}, { melhorOfertaCompra: 99.8, melhorOfertaVenda: 100.2 }, { melhorOfertaCompra: 99.9, melhorOfertaVenda: 100.1 }];
  const c = dx.custoDeExecucao({ velas });
  assert.equal(c.pregoes, 3);
  assert.ok(Math.abs(c.idaEVoltaPct - 0.2) < 1e-9);
  assert.equal(dx.custoDeExecucao([{}]), null);
});

test('plano sem campos novos fica identico', () => {
  const p = montarPlano(base());
  for (const k of ['alertaDataEx', 'custoExecucao', 'alvoLiquido', 'entradaPrecoMedio']) assert.equal(k in p, false, k);
  assert.equal(p.acao, 'COMPRAR');
  assert.equal(dx.htmlAvisosPlano(p), '');
});

test('plano com alerta, custo e preco medio nao muda a recomendacao', () => {
  const ref = montarPlano(base());
  const d = base();
  d.datasEx = dto;
  d.pregoes = pregoes({ melhorOfertaCompra: 99.5, melhorOfertaVenda: 100.5, precoMedio: 99.8 });
  const p = montarPlano(d);
  for (const k of ['acao', 'forca', 'rr', 'alvo', 'stop', 'upside_pct', 'motivos']) assert.deepEqual(p[k], ref[k], k);
  assert.equal(p.alertaDataEx.dias, 7);
  assert.ok(Math.abs(p.custoExecucao.idaEVoltaPct - 1.0) < 0.01);
  assert.ok(Math.abs(p.alvoLiquido.upsidePct - (p.upside_pct - p.custoExecucao.idaEVoltaPct)) < 1e-9);
  assert.equal(p.entradaPrecoMedio, 99.8);
  const html = dx.htmlAvisosPlano(p);
  assert.match(html, /data ex em 7 dias/);
  assert.match(html, /Alvo líquido do custo/);
  assert.match(html, /preço médio/);
});

test('bloco Datas ex renderiza tabela, proxima data e origem; vazio e discreto', () => {
  const h = htmlDatasEx(dto, hoje);
  assert.match(h, /DIVIDENDO/);
  assert.match(h, /confiança MEDIA/);
  assert.match(h, /Origem dos dados/);
  assert.equal((h.match(/<tr><td>/g) || []).length, 2); // evento de 2020 fora de 24 meses
  for (const vazio of [null, undefined, {}, { eventos: [], resumo: null }]) assert.match(htmlDatasEx(vazio, hoje), /Sem datas ex disponíveis/);
});

test('forma real do gestor ({velas} com maxima/minima) e array antigo geram plano', () => {
  const velas = Array.from({ length: 25 }, (_, i) => ({ data: `2026-09-${String(i + 1).padStart(2, '0')}`, maxima: 101 + Math.sin(i) * 0.1, minima: 99, fechamento: 100 + Math.sin(i) * 0.1 }));
  const d = { analise: { recomendacao: 'COMPRA_FORTE', preco_atual: 100 }, fundamentosCvm: { graham_number: 120 }, backtest: null, opiniao: null };
  const real = montarPlano({ ...d, pregoes: { simbolo: 'PETR4', velas } });
  assert.equal(real.acao, 'COMPRAR');
  assert.ok(real.stop > 0);
  const antigo = montarPlano({ ...d, pregoes: velas.map((v) => ({ max: v.maxima, min: v.minima, fechamento: v.fechamento })) });
  assert.deepEqual({ ...real }, { ...antigo });
  for (const ruim of [null, {}, { velas: [] }, 'x']) assert.deepEqual(montarPlano({ ...d, pregoes: ruim }).motivos, ['Menos de 15 pregões disponíveis']);
});
