// REQ-ETL-1..3 na ficha: status CVM, ticket medio dos pregoes e FCO bruto x liquido.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { statusCvm, htmlSeloStatusCvm, htmlAlertaStatusCvm } = await import('../public/js/analise/statusCvm.js');
const { calcularTicketMedio, ticketMedioDaVela, ticketMedioDaSerie } = await import('../public/js/analise/pregoes.js');
const { compararFco } = await import('../public/js/analise/fluxoCaixa.js');
const { renderizar } = await import('../public/js/components/ficha/UltimosPregoes.js');
const { velasDoBanco } = await import('../public/js/api/pregoesApi.js');

let casos = 0;
function caso(nome, fn) { fn(); casos++; console.log(`  ok  ${nome}`); }

caso('status CVM: valores reais do FCA viram chave, tom e alerta so para suspenso e cancelado', () => {
  assert.equal(statusCvm('Ativo').chave, 'ATIVO');
  assert.equal(statusCvm('Suspenso').tom, 'warning');
  assert.equal(statusCvm('Cancelado').tom, 'danger');
  assert.equal(statusCvm('  CANCELADA ').chave, 'CANCELADO');
  assert.equal(statusCvm('Em análise').chave, 'DESCONHECIDO');
  assert.equal(statusCvm(null), null);
  assert.equal(statusCvm(''), null);
  assert.equal(htmlAlertaStatusCvm('Ativo'), '');
  assert.match(htmlAlertaStatusCvm('Cancelado'), /alert-danger/);
  assert.match(htmlAlertaStatusCvm('Suspenso'), /alert-warning/);
  assert.equal(htmlAlertaStatusCvm(null), '');
});

caso('status CVM: o selo sempre traz texto junto da cor e escapa a entrada', () => {
  assert.match(htmlSeloStatusCvm('Ativo'), /CVM: ativo/);
  assert.match(htmlSeloStatusCvm('Cancelado'), /CVM: cancelado/);
  assert.equal(htmlSeloStatusCvm(undefined), '');
  assert.ok(!htmlSeloStatusCvm('<img src=x onerror=1>').includes('<img'));
});

caso('ticket medio: exato com volume financeiro, nulo sem negocios, nunca zero', () => {
  assert.equal(calcularTicketMedio(1131691177, 75352), 1131691177 / 75352);
  assert.equal(calcularTicketMedio(100, 0), null);
  assert.equal(calcularTicketMedio(100, null), null);
  assert.equal(calcularTicketMedio(null, 10), null);
  assert.deepEqual(ticketMedioDaVela({ volumeFinanceiro: 1000, numeroNegocios: 4 }), { valor: 250, estimado: false });
});

caso('ticket medio: sem volume financeiro estima so pregao diario e marca como estimado', () => {
  const dia = { volume: 100, close: 10, numeroNegocios: 5, pregoes: 1 };
  assert.deepEqual(ticketMedioDaVela(dia), { valor: 200, estimado: true });
  assert.equal(ticketMedioDaVela({ ...dia, pregoes: 5 }), null, 'semana sem volume financeiro nao se estima');
  assert.equal(ticketMedioDaVela({ ...dia, numeroNegocios: 0 }), null);
  assert.equal(ticketMedioDaVela(null), null);
});

caso('ticket medio da serie e ponderado pelos negocios e ignora velas sem dado', () => {
  const serie = ticketMedioDaSerie([
    { volumeFinanceiro: 1000, numeroNegocios: 10 },
    { volumeFinanceiro: 3000, numeroNegocios: 10 },
    { volumeFinanceiro: null, numeroNegocios: 0, volume: 5, close: 1, pregoes: 1 },
  ]);
  assert.deepEqual(serie, { valor: 200, estimado: false, velas: 2 });
  assert.equal(ticketMedioDaSerie([]), null);
});

caso('velasDoBanco carrega numeroNegocios e volumeFinanceiro (nulo quando o gestor nao manda)', () => {
  const [v] = velasDoBanco({ velas: [{ data: '2026-10-05', abertura: 1, maxima: 2, minima: 1, fechamento: 2, volume: 10, numeroNegocios: 3, pregoes: 1 }] });
  assert.equal(v.numeroNegocios, 3);
  assert.equal(v.volumeFinanceiro, null);
  const [w] = velasDoBanco({ velas: [{ data: '2026-10-05', abertura: 1, maxima: 2, minima: 1, fechamento: 2, volume: 10, numeroNegocios: 3, volumeFinanceiro: 30, pregoes: 1 }] });
  assert.equal(w.volumeFinanceiro, 30);
});

caso('ultimos pregoes: tabela com ticket, aproximado marcado e traco quando ausente', () => {
  const velas = [
    { dataIso: '2026-10-05', dataFormatada: '05/10/2026', close: 51.25, volume: 22279300, numeroNegocios: 75352, pregoes: 1 },
    { dataIso: '2026-10-06', dataFormatada: '06/10/2026', close: 50.75, volume: 13060600, numeroNegocios: 36504, pregoes: 1, volumeFinanceiro: 666214721 },
    { dataIso: '2026-10-07', dataFormatada: '07/10/2026', close: 51.27, volume: 0, numeroNegocios: 0, pregoes: 1 },
  ];
  const html = renderizar(velas);
  assert.match(html, /Ticket médio/);
  assert.match(html, /≈ R\$ /);
  assert.match(html, /R\$ 18\.250,46/);
  assert.match(html, /<td data-label="Ticket médio" class="text-end">—<\/td>/);
  assert.match(html, /polyline/);
  assert.match(renderizar([]), /Sem pregões/);
  assert.match(renderizar([{ dataIso: '2026-10-05', dataFormatada: '05/10/2026', close: 1, numeroNegocios: 0, volume: 0, pregoes: 1 }]), /indisponível/);
});

caso('FCO: bruto e liquido, delta em R$ e % da receita; ausente nao vira zero nem esconde o liquido', () => {
  const ambos = compararFco({ fco_bruto: 1200, fluxo_caixa_operacional: 1000, receita_liquida: 10000 });
  assert.equal(ambos.delta, 200);
  assert.equal(ambos.deltaPercentualDaReceita, 2);
  assert.equal(ambos.maxAbs, 1200);
  const soLiquido = compararFco({ fco_bruto: null, fluxo_caixa_operacional: 6451033000, receita_liquida: 40804110000 });
  assert.equal(soLiquido.bruto, null);
  assert.equal(soLiquido.liquido, 6451033000);
  assert.equal(soLiquido.delta, null);
  assert.equal(soLiquido.deltaPercentualDaReceita, null);
  assert.equal(compararFco({}), null);
  assert.equal(compararFco({ fco_bruto: '', fluxo_caixa_operacional: undefined }), null);
  assert.equal(compararFco({ fco_bruto: 5, fluxo_caixa_operacional: 3, receita_liquida: 0 }).deltaPercentualDaReceita, null);
});

console.log(`${casos} casos ok`);
