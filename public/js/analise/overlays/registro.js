/**
 * F360-PAI-5: Registro de overlays técnicos
 * Cada overlay é registrado aqui com id, rótulo, horizonte e função calcular.
 * O PainelTecnico percorre este registro em vez de ter os overlays hardcoded.
 */

import { overlayPivos } from './overlayPivos.js';
import { overlayCanal } from './overlayCanal.js';
import { overlayFibonacci } from './overlayFibonacci.js';
import { overlayNr7, overlayOco, overlayDuplo, overlayTriangulo, overlayBandeira, overlayFibExtensao, overlayTendencia, overlayCanalLongo, overlayWyckoff, overlayCopa, overlayElliott } from './stubs.js';

/**
 * Registro de overlays técnicos.
 * Cada overlay tem:
 * - id: identificador único
 * - rotulo: nome curto para exibição
 * - horizonte: 'curto', 'medio' ou 'longo'
 * - calcular(candles): função que retorna { linhas, marcadores }
 */
export const REGISTRO_OVERLAYS = [
  overlayPivos,
  overlayCanal,
  overlayFibonacci,
  overlayNr7,
  overlayOco,
  overlayDuplo,
  overlayTriangulo,
  overlayBandeira,
  overlayFibExtensao,
  overlayTendencia,
  overlayCanalLongo,
  overlayWyckoff,
  overlayCopa,
  overlayElliott,
];

/**
 * Retorna overlays por horizonte.
 */
export function overlaysPorHorizonte(horizonte) {
  return REGISTRO_OVERLAYS.filter((o) => o.horizonte === horizonte);
}

/**
 * Retorna overlay por id.
 */
export function overlayPorId(id) {
  return REGISTRO_OVERLAYS.find((o) => o.id === id);
}
