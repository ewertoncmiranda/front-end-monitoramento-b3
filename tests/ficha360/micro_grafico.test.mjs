// MICRO-PAI-1: preco medio, marcas de data ex e gap explicado pela data ex.
import assert from 'node:assert/strict';
import { velasDoBanco } from '../../public/js/api/pregoesApi.js';
import { MARCAS_EX, codigosDaMarca, descricaoDaMarca, marcadoresDataEx, listaDataEx } from '../../public/js/analise/overlays/overlayDataEx.js';
import { linhaPrecoMedio, precoMedioDisponivel } from '../../public/js/analise/overlays/overlayPrecoMedio.js';
import { PADROES, ALERTAS, detectar } from '../../public/js/analise/detectorPadroes.js';

// API: campos novos atravessam; ausentes viram null
const velas = velasDoBanco({ velas: [
  { data: '2026-10-01', abertura: 10, maxima: 11, minima: 9, fechamento: 10.5, volume: 100, precoMedio: '10.2', melhorOfertaCompra: 10.4, melhorOfertaVenda: 10.6, marcaEx: 'EJ' },
  { data: '2026-10-02', abertura: 10, maxima: 11, minima: 9, fechamento: 10.5, volume: 100 },
] });
assert.equal(velas[0].precoMedio, 10.2);
assert.equal(velas[0].melhorOfertaCompra, 10.4);
assert.equal(velas[0].marcaEx, 'EJ');
assert.equal(velas[1].precoMedio, null);
assert.equal(velas[1].marcaEx, null);

// mapa de marcas
assert.equal(descricaoDaMarca('EJ'), 'Data ex: JCP (EJ)');
assert.equal(descricaoDaMarca('ED'), 'Data ex: Dividendo (ED)');
assert.equal(descricaoDaMarca('EJED'), 'Data ex: JCP + Dividendo (EJ+ED)');
assert.equal(descricaoDaMarca('EJ,ED'), 'Data ex: JCP + Dividendo (EJ+ED)');
assert.equal(descricaoDaMarca('ZZ'), 'Data ex: evento (ZZ)');
assert.equal(descricaoDaMarca(null), '');
assert.deepEqual(Object.keys(MARCAS_EX).sort(), ['EB', 'ED', 'EG', 'EJ', 'ER', 'ES', 'EX']);
assert.deepEqual(codigosDaMarca('eb'), ['EB']);

const marcadores = marcadoresDataEx(velas);
assert.equal(marcadores.length, 1);
assert.equal(marcadores[0].dataIso, '2026-10-01');
assert.match(marcadores[0].texto, /JCP/); // rotulo textual, nao so cor
assert.equal(listaDataEx(velas)[0].descricao, 'Data ex: JCP (EJ)');
assert.deepEqual(marcadoresDataEx([]), []);

// preco medio: so dia, pula velas sem o campo
const diarias = [
  { dataIso: '2026-10-01', precoMedio: 10 },
  { dataIso: '2026-10-02' },
  { dataIso: '2026-10-03', precoMedio: 11 },
];
const linha = linhaPrecoMedio(diarias, 'dia');
assert.equal(linha.length, 1);
assert.deepEqual(linha[0].points, [{ time: '2026-10-01', value: 10 }, { time: '2026-10-03', value: 11 }]);
assert.deepEqual(linhaPrecoMedio(diarias, 'semana'), []);
assert.equal(precoMedioDisponivel(diarias, 'mes'), false);
assert.deepEqual(linhaPrecoMedio([{ dataIso: 'x' }], 'dia'), []);

// detector: gap de baixa sem marca vs. com marca ex
const serie = (marcaEx) => [
  { open: 10, high: 10.3, low: 9.9, close: 10.1, volume: 100 },
  { open: 10.1, high: 10.2, low: 9.9, close: 10.0, volume: 100 },
  { open: 10.0, high: 10.1, low: 9.8, close: 10.0, volume: 100 },
  { open: 9.0, high: 10.4, low: 8.9, close: 10.2, volume: 100, marcaEx }, // abre -10% sobre o fechamento anterior
];
const por = (id) => [...PADROES, ...ALERTAS].find((x) => x.id === id);
const semMarca = serie(null);
const comMarca = serie('EJ');

assert.deepEqual(detectar(semMarca, por('gap')), [3]);
assert.deepEqual(detectar(comMarca, por('gap')), []);
assert.deepEqual(detectar(semMarca, por('gap-data-ex')), []);
assert.deepEqual(detectar(comMarca, por('gap-data-ex')), [3]);
assert.match(por('gap-data-ex').resumo, /Gap explicado por data ex/);

// padrao que depende do gap (engolfo de alta): o gap falso some com a marca
assert.deepEqual(detectar(semMarca, por('engolfo-alta')), [], 'precisa de vela anterior de baixa');
const engolfo = (marcaEx) => [
  { open: 10.5, high: 10.6, low: 9.9, close: 10.0, volume: 100 },
  { open: 9.2, high: 10.8, low: 9.1, close: 10.7, volume: 100, marcaEx },
];
assert.deepEqual(detectar(engolfo(null), por('engolfo-alta')), [1]);
assert.deepEqual(detectar(engolfo('ED'), por('engolfo-alta')), []);

// padroes sem gap seguem iguais com marca
const doji = [{ open: 10, high: 11, low: 9, close: 10.05, volume: 1 }];
assert.deepEqual(detectar([{ ...doji[0], marcaEx: 'EJ' }], por('doji')), detectar(doji, por('doji')));

console.log('micro_grafico: ok');
