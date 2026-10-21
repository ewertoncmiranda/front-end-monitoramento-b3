// FONTES-PAI-1: premio de risco contra a NTN-B e Graham ajustado pelo juro.
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {}, get() { return undefined; } };
const pr = await import('../../public/js/analise/ficha360/premioRisco.js');
const { htmlPremioRisco } = await import('../../public/js/components/ficha360/secoes/SecaoValuation.js');
const { rotaDaChave, CHAVES_DO_CONTEXTO } = await import('../../public/js/api/ficha360Api.js');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const dto = {
  simbolo: 'PETR4', earningsYield: 12.5, juroReal: 7.2, vencimentoReferencia: '2031-08-15', dataBase: '2026-10-16',
  premioRisco: 5.3, veredito: 'ACIMA_DA_RENDA_FIXA', leitura: 'Rende 5,30 p.p. acima da NTN-B.',
  selicMeta: 14.5, premioSobreSelic: -2, motivo: null,
};

await caso('rota premioRisco no contrato', () => {
  assert.ok(CHAVES_DO_CONTEXTO.includes('premioRisco'));
  assert.equal(rotaDaChave('premioRisco', 'PETR4'), '/ativos/PETR4/premio-risco');
});
await caso('modelo completo, selos e premio sobre a Selic', () => {
  const m = pr.modeloPremioRisco(dto);
  assert.equal(m.disponivel, true);
  assert.equal(m.selo.texto, 'Acima da renda fixa');
  assert.equal(m.seloSelic.texto, 'Abaixo da renda fixa');
  assert.equal(pr.seloDoVeredito('IGUAL_A_RENDA_FIXA').icone, '=');
  assert.equal(pr.seloDoVeredito(null, 0).texto, 'Igual à renda fixa');
  assert.equal(pr.seloDoVeredito(null, null), null);
});
await caso('DTO nulo (503) e campos nulos com motivo nao quebram', () => {
  assert.equal(pr.modeloPremioRisco(null).disponivel, false);
  const m = pr.modeloPremioRisco({ earningsYield: null, juroReal: 7, motivo: 'Sem insight.' });
  assert.equal(m.disponivel, false);
  assert.equal(m.motivo, 'Sem insight.');
});
await caso('Graham ajustado = V x 4,4 / Y; Y invalido = null', () => {
  assert.ok(Math.abs(pr.grahamAjustadoPeloJuro(30, 14.5) - 30 * 4.4 / 14.5) < 1e-12);
  assert.equal(pr.grahamAjustadoPeloJuro(30, 0), null);
  assert.equal(pr.grahamAjustadoPeloJuro(null, 10), null);
  assert.equal(pr.grahamAjustadoPeloJuro(30, null), null);
});
await caso('formatacao', () => {
  assert.equal(pr.formatarPontos(5.3), '+5,30 p.p.');
  assert.equal(pr.formatarPontos(-2), '-2,00 p.p.');
  assert.equal(pr.formatarData('2026-10-16'), '16/10/2026');
  assert.equal(pr.formatarPercentual(null), '—');
});
await caso('renderizacao completa: valores, vencimento, selo texto+icone, leitura e Selic', () => {
  const h = htmlPremioRisco(pr.modeloPremioRisco(dto));
  for (const t of ['Rendimento contra renda fixa', '12,50%', '7,20%', '15/08/2031', '16/10/2026', '+5,30 p.p.',
    'Acima da renda fixa', '▲', 'Rende 5,30 p.p. acima', 'Selic meta (14,50%)', '-2,00 p.p.', '▼']) assert.ok(h.includes(t), t);
});
await caso('renderizacao degradada vira aviso e escapa HTML', () => {
  const h = htmlPremioRisco(pr.modeloPremioRisco(null));
  assert.ok(h.includes('data-premio-aviso') && !h.includes('data-premio>'));
  assert.ok(htmlPremioRisco(pr.modeloPremioRisco({ motivo: '<b>x</b>' })).includes('&lt;b&gt;'));
});
console.log(`fontes_valuation: ${casos} casos`);
