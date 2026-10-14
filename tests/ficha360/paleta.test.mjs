// F360-PAI-11: tokens de cor (C4) e CandleChart lendo a paleta.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.HTMLElement = class {};
globalThis.customElements = { define() {} };

const { coresDoGrafico, indiceDaData, CandleChart } = await import('../../public/js/components/CandleChart.js');
const css = readFileSync(new URL('../../public/css/app.css', import.meta.url), 'utf8');

let casos = 0;
async function caso(nome, fn) { await fn(); casos++; console.log(`  ok  ${nome}`); }

const TOKENS = {
  '--f360-compra-forte': ['#15803d', '#22c55e'],
  '--f360-compra': ['#16a34a', '#4ade80'],
  '--f360-manter': ['#b45309', '#f59e0b'],
  '--f360-venda': ['#be123c', '#f43f5e'],
  '--f360-info': ['#0369a1', '#38bdf8'],
  '--f360-superficie': ['#ffffff', '#0f172a'],
  '--f360-superficie-2': ['#f1f5f9', '#1e293b'],
  '--f360-texto-mudo': ['#64748b', '#94a3b8'],
};

function bloco(seletor) {
  const inicio = css.indexOf(`${seletor} {`);
  assert.ok(inicio >= 0, `bloco ${seletor} ausente`);
  return css.slice(inicio, css.indexOf('}', inicio));
}

await caso('todos os tokens do C4 no claro (:root) e no escuro', () => {
  const claro = bloco(':root');
  const escuro = bloco('[data-bs-theme="dark"]');
  for (const [token, [vClaro, vEscuro]] of Object.entries(TOKENS)) {
    assert.match(claro, new RegExp(`${token}: ${vClaro};`), `${token} claro`);
    assert.match(escuro, new RegExp(`${token}: ${vEscuro};`), `${token} escuro`);
  }
  assert.ok(css.indexOf(':root {') < css.indexOf('[data-bs-theme="dark"] {\n  --f360'), 'escuro depois do claro');
});

await caso('grafico usa os tokens quando existem', () => {
  const valores = { '--f360-compra-forte': '#22c55e', '--f360-venda': '#f43f5e', '--bs-border-color': '#495057' };
  const cores = coresDoGrafico((n) => valores[n] || '');
  assert.equal(cores.alta, '#22c55e');
  assert.equal(cores.baixa, '#f43f5e');
  assert.equal(cores.borda, '#495057');
});

await caso('sem tokens (fora do navegador): cores de antes', () => {
  const cores = coresDoGrafico(() => '');
  assert.deepEqual([cores.alta, cores.baixa, cores.texto, cores.grade, cores.borda],
    ['#198754', '#dc3545', '#495057', '#f1f1f1', '#dee2e6']);
});

await caso('indiceDaData: exata, proxima depois, inexistente', () => {
  const velas = [{ dataIso: '2026-10-01' }, { dataIso: '2026-10-02' }, { dataIso: '2026-10-05' }];
  assert.equal(indiceDaData(velas, '2026-10-02'), 1);
  assert.equal(indiceDaData(velas, '2026-10-03'), 2);
  assert.equal(indiceDaData(velas, '2026-11-01'), -1);
  assert.equal(indiceDaData([], '2026-10-01'), -1);
  assert.equal(indiceDaData(velas, null), -1);
});

await caso('focarData centraliza mantendo o zoom e marca a vela; sem grafico devolve false', () => {
  const grafico = new CandleChart();
  assert.equal(grafico.focarData('2026-10-02'), false);

  let faixa = null;
  let marcadores = null;
  grafico._candles = Array.from({ length: 100 }, (_, i) => ({ dataIso: `2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}` }));
  grafico._chart = { timeScale: () => ({ getVisibleLogicalRange: () => ({ from: 60, to: 100 }), setVisibleLogicalRange: (r) => { faixa = r; } }) };
  grafico._serie = { setMarkers: (m) => { marcadores = m; } };
  globalThis.document = { documentElement: {} };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });

  assert.equal(grafico.focarData('2026-01-11'), true);
  assert.deepEqual(faixa, { from: -10, to: 30 });
  assert.equal(marcadores.length, 1);
  assert.equal(marcadores[0].time, '2026-01-11');
  assert.equal(grafico.focarData('2099-01-01'), false);
  clearTimeout(grafico._timerFoco);
});

await caso('troca de tema recolore sem recriar o grafico', () => {
  const grafico = new CandleChart();
  const aplicados = [];
  grafico._chart = { applyOptions: (o) => aplicados.push(['grafico', o]) };
  grafico._serie = { applyOptions: (o) => aplicados.push(['serie', o]) };
  globalThis.getComputedStyle = () => ({ getPropertyValue: (n) => (n === '--f360-venda' ? ' #f43f5e ' : '') });
  grafico.aplicarCores();
  assert.equal(aplicados.length, 2);
  assert.equal(aplicados[1][1].downColor, '#f43f5e');
  assert.equal(aplicados[1][1].upColor, '#198754');
});

console.log(`paleta: ${casos} casos`);
