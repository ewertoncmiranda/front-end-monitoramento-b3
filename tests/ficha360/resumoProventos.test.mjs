import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlResumoProventos, htmlFaixaEventos, eventosDaVela, htmlEventoDaVela } from '../../public/js/analise/resumoProventos.js';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };
const { PainelCandles } = await import('../../public/js/components/painelCandles/PainelCandles.js');
const { buscarResumoProventos } = await import('../../public/js/api/proventosResumoApi.js');
const evento = { dataEx: '2026-05-04', tipo: 'JCP', marca: 'EJ', valorPorAcao: 0.02, ajusteImplicito: 0.1, ajustePercentual: 0.2, fechamentoAnterior: 50, aberturaEx: 49.9, fonte: 'B3', pagamentos: [{ dataPagamento: '2026-06-01', valorPorAcao: 0.02, tipo: 'JCP' }] };
const dto = { de: '2026-04-22', ate: '2026-10-20', eventos: [evento], resumo: { totalPorAcao: 0.02, jcpPorAcao: 0.02, dividendosPorAcao: null, quantidadeEventos: 1, eventosComValor: 1, retornoPrecoPercentual: 5, contribuicaoProventosPontosPercentuais: 0.04, retornoComProventosPercentual: 5.04, ajusteMedioPercentual: 0.2, mesesComEventos: 1, intervaloMedioDias: null, ultimoEvento: '2026-05-04', coberturaCompleta: true, limitacoes: [] }, sinteseHolistica: 'Contribuição de 0,04 p.p.' };

test('quatro cards, parcelas e leitura holística preservam valor oficial e premissas', () => {
  const html = htmlResumoProventos(dto);
  assert.equal((html.match(/class="card h-100"/g) || []).length, 4);
  assert.match(html, /5,04%/);
  assert.match(html, /0,04 p.p./);
  assert.match(html, /01\/06\/2026/);
  assert.match(html, /sem reinvestimento/);
  assert.match(html, /valores brutos/);
  assert.match(html, /<details/);
  assert.equal((html.match(/<tr><td>/g) || []).length, 1);
});

test('cobertura parcial bloqueia retorno mesmo se campo numérico vier preenchido', () => {
  const html = htmlResumoProventos({ ...dto, resumo: { ...dto.resumo, coberturaCompleta: false } });
  assert.doesNotMatch(html, /5,04%/);
  assert.match(html, /cobertura parcial/);
  assert.match(html, /contribuição: indisponível/);
  assert.match(htmlResumoProventos({ eventos: [{ ...evento, valorPorAcao: null }], resumo: {} }), /Indisponível/);
  assert.match(htmlResumoProventos(null, { erro: true }), /gráfico continua disponível/);
});

test('eventos em vela semanal e mensal usam intervalo real sem repetir por pregão', () => {
  assert.equal(eventosDaVela([evento], { dataIso: '2026-05-01', dataFim: '2026-05-08' }).length, 1);
  assert.equal(eventosDaVela([evento], { dataIso: '2026-05-05' }).length, 0);
  assert.match(htmlEventoDaVela([evento], { dataIso: '2026-05-04' }), /JCP/);
  assert.equal(htmlEventoDaVela([evento], null), '');
  assert.equal((htmlFaixaEventos([evento]).match(/data-evento-ex=/g) || []).length, 1);
});

test('dados externos são escapados em cards, faixa e tabela', () => {
  const html = htmlResumoProventos({ ...dto, sinteseHolistica: '<script>alert(1)</script>', eventos: [{ ...evento, fonte: '<img src=x onerror=x>' }] });
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;/);
});

test('velas com EJ repetido não geram mais marcadores ou lista; técnico é preservado', () => {
  const painel = new PainelCandles();
  painel._simbolo = 'ITUB4';
  painel._candles = Array.from({ length: 8 }, (_, i) => ({ dataIso: `2026-05-${String(i + 4).padStart(2, '0')}`, marcaEx: 'EJ' }));
  const html = painel.templateGrafico(painel._candles);
  assert.doesNotMatch(html, /Ex JCP|Datas ex no período/);
  assert.match(html, /id="faixa-eventos-ex"[^>]*hidden/);
  let marcadores;
  painel._tecnico = { linhas: [], marcadores: [{ texto: 'RSI' }] };
  painel.querySelector = () => ({ setLinhas() {}, setMarcadoresTecnico: (v) => { marcadores = v; } });
  painel.aplicarOverlaysProprios();
  assert.deepEqual(marcadores, [{ texto: 'RSI' }]);
});

test('rota transporta ticker e período sem depender do intervalo das velas', async () => {
  let url;
  globalThis.fetch = async (u) => { url = u; return { ok: true, text: async () => JSON.stringify(dto) }; };
  assert.deepEqual(await buscarResumoProventos('ITUB4', { de: '2026-04-22', ate: '2026-10-20' }), dto);
  assert.match(url, /\/ativos\/ITUB4\/proventos-resumo\?de=2026-04-22&ate=2026-10-20$/);
});

test('resposta atrasada não sobrescreve outro período nem componente desconectado', async () => {
  let resolver;
  globalThis.fetch = () => new Promise((resolve) => { resolver = resolve; });
  const painel = new PainelCandles();
  painel._simbolo = 'ITUB4'; painel._requisicaoVelas = 1; painel.isConnected = true;
  const area = { innerHTML: 'novo período' };
  painel.querySelector = () => area;
  const carregamento = painel.carregarResumoProventos([{ dataIso: '2026-05-01' }], 1);
  painel._requisicaoVelas = 2;
  resolver({ ok: true, text: async () => JSON.stringify(dto) });
  await carregamento;
  assert.equal(area.innerHTML, 'novo período');
  assert.equal(painel._resumoProventos, null);
});
