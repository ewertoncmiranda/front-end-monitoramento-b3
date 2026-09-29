// Datas do painel: horario de Brasilia e formato dd-MM-yyyy.
import assert from 'node:assert/strict';
import { formatarData, formatarDataHora } from '../public/js/utils/dataHora.js';
import { dataBr } from '../public/js/analise/fichaDoAtivo.js';

// Data pura (pregao, periodo) nao muda de dia com o fuso.
assert.equal(formatarData('2026-09-28'), '28-09-2026');
assert.equal(formatarDataHora('2026-09-28'), '28-09-2026');

// Data e hora sem fuso vem dos servicos em UTC: -3h em Brasilia.
assert.equal(formatarDataHora('2026-09-28T11:44:53'), '28-09-2026 08:44');
assert.equal(formatarDataHora('2026-09-29 10:53:44'), '29-09-2026 07:53');
// LocalDateTime do Java com nanossegundos.
assert.equal(formatarDataHora('2026-09-29T11:03:50.554241734'), '29-09-2026 08:03');
// Madrugada UTC ainda e o dia anterior em Brasilia.
assert.equal(formatarData('2026-09-28T02:30:00'), '27-09-2026');
assert.equal(formatarDataHora('2026-09-28T02:30:00'), '27-09-2026 23:30');

// Com fuso explicito (regularMarketTime da BRAPI, pubDate do RSS) e Date.
assert.equal(formatarDataHora('2026-09-28T21:14:30.000Z'), '28-09-2026 18:14');
assert.equal(formatarDataHora('Mon, 28 Sep 2026 23:30:00 GMT'), '28-09-2026 20:30');
assert.equal(formatarData(new Date(Date.UTC(2026, 8, 29, 1, 0))), '28-09-2026');

// Vazio usa o texto pedido; valor ilegivel sai como veio.
assert.equal(formatarData(null), '-');
assert.equal(formatarDataHora(undefined, 'cotação indisponível'), 'cotação indisponível');
assert.equal(formatarData('sem data'), 'sem data');

// A ficha do ativo segue o mesmo formato.
assert.equal(dataBr('2026-09-25'), '25-09-2026');
assert.equal(dataBr(null), '—');

console.log('dataHora: ok');
