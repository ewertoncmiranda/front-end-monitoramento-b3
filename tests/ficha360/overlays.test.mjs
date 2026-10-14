/**
 * F360-PAI-5: Testes do registro de overlays técnicos
 */

import { REGISTRO_OVERLAYS, overlaysPorHorizonte, overlayPorId } from '../../public/js/analise/overlays/registro.js';

console.log('Testando registro de overlays técnicos...');

// Teste 1: Verificar se o registro tem 14 overlays
console.log('Teste 1: Verificar se o registro tem 14 overlays...');
if (REGISTRO_OVERLAYS.length !== 14) {
  throw new Error(`Esperado 14 overlays, recebido ${REGISTRO_OVERLAYS.length}`);
}
console.log('✓ Teste 1 passou');

// Teste 2: Verificar estrutura de cada overlay
console.log('Teste 2: Verificar estrutura de cada overlay...');
for (const overlay of REGISTRO_OVERLAYS) {
  if (!overlay.id || typeof overlay.id !== 'string') {
    throw new Error(`Overlay sem id válido: ${JSON.stringify(overlay)}`);
  }
  if (!overlay.rotulo || typeof overlay.rotulo !== 'string') {
    throw new Error(`Overlay sem rotulo válido: ${JSON.stringify(overlay)}`);
  }
  if (!overlay.horizonte || !['curto', 'medio', 'longo'].includes(overlay.horizonte)) {
    throw new Error(`Overlay com horizonte inválido: ${JSON.stringify(overlay)}`);
  }
  if (typeof overlay.calcular !== 'function') {
    throw new Error(`Overlay sem função calcular: ${JSON.stringify(overlay)}`);
  }
}
console.log('✓ Teste 2 passou');

// Teste 3: Verificar overlaysPorHorizonte
console.log('Teste 3: Verificar overlaysPorHorizonte...');
const curto = overlaysPorHorizonte('curto');
const medio = overlaysPorHorizonte('medio');
const longo = overlaysPorHorizonte('longo');

if (curto.length !== 4) throw new Error(`Esperado 4 overlays curto, recebido ${curto.length}`);
if (medio.length !== 5) throw new Error(`Esperado 5 overlays medio, recebido ${medio.length}`);
if (longo.length !== 5) throw new Error(`Esperado 5 overlays longo, recebido ${longo.length}`);
console.log('✓ Teste 3 passou');

// Teste 4: Verificar overlayPorId
console.log('Teste 4: Verificar overlayPorId...');
const pivos = overlayPorId('pivos');
if (!pivos || pivos.id !== 'pivos') {
  throw new Error('overlayPorId não encontrou pivos');
}
const inexistente = overlayPorId('inexistente');
if (inexistente !== undefined) {
  throw new Error('overlayPorId deve retornar undefined para id inexistente');
}
console.log('✓ Teste 4 passou');

// Teste 5: Verificar que overlayPivos calcula corretamente
console.log('Teste 5: Verificar que overlayPivos calcula corretamente...');
const candles = [
  { high: 100, low: 90, dataIso: '2024-01-01' },
  { high: 105, low: 95, dataIso: '2024-01-02' },
  { high: 110, low: 100, dataIso: '2024-01-03' },
  { high: 105, low: 95, dataIso: '2024-01-04' },
  { high: 100, low: 90, dataIso: '2024-01-05' },
];
const resultado = pivos.calcular(candles);
if (!resultado.linhas || resultado.linhas.length === 0) {
  throw new Error('overlayPivos não gerou linhas');
}
if (!resultado.marcadores) {
  throw new Error('overlayPivos não tem marcadores');
}
console.log('✓ Teste 5 passou');

// Teste 6: Verificar que overlayCanal calcula corretamente
console.log('Teste 6: Verificar que overlayCanal calcula corretamente...');
const canal = overlayPorId('canal');
const resultadoCanal = canal.calcular(candles);
if (!resultadoCanal.linhas || resultadoCanal.linhas.length !== 2) {
  throw new Error('overlayCanal não gerou 2 linhas');
}
console.log('✓ Teste 6 passou');

console.log('\n✅ Todos os testes de overlays passaram!');
