import { ConflictException } from '@nestjs/common';
import { ESTADOS_SOLICITUD } from '../adopcion.model';
import type { EstadoSolicitud } from '../adopcion.model';
import { ESTADOS_ACTIVOS, puedeTransicionar, validarTransicion } from './transiciones-solicitud';

// Transiciones válidas escritas a mano para no depender de la tabla que se prueba.
const VALIDAS = new Set<string>([
  'pendiente→aprobada',
  'pendiente→rechazada',
  'pendiente→cancelada',
  'aprobada→completada',
  'aprobada→cancelada',
]);

const MATRIZ: [EstadoSolicitud, EstadoSolicitud, boolean][] = ESTADOS_SOLICITUD.flatMap((actual) =>
  ESTADOS_SOLICITUD.map((nuevo): [EstadoSolicitud, EstadoSolicitud, boolean] => [
    actual,
    nuevo,
    VALIDAS.has(`${actual}→${nuevo}`),
  ]),
);

describe('transiciones de solicitudes', () => {
  it('cubre la matriz completa de 5x5', () => {
    expect(MATRIZ).toHaveLength(25);
  });

  describe('puedeTransicionar', () => {
    it.each(MATRIZ)('%s → %s es %p', (actual, nuevo, esperado) => {
      expect(puedeTransicionar(actual, nuevo)).toBe(esperado);
    });
  });

  describe('validarTransicion', () => {
    it.each(MATRIZ.filter(([, , valida]) => valida))('permite %s → %s', (actual, nuevo) => {
      expect(() => validarTransicion(actual, nuevo)).not.toThrow();
    });

    it.each(MATRIZ.filter(([, , valida]) => !valida))('rechaza %s → %s con ConflictException', (actual, nuevo) => {
      expect(() => validarTransicion(actual, nuevo)).toThrow(ConflictException);
    });

    it('incluye el estado actual y el solicitado en el mensaje', () => {
      expect(() => validarTransicion('rechazada', 'aprobada')).toThrow(/'rechazada'.*'aprobada'/);
    });
  });

  it('considera activas solo las solicitudes pendientes y aprobadas', () => {
    expect([...ESTADOS_ACTIVOS].sort()).toEqual(['aprobada', 'pendiente']);
  });

  it('los estados finales no tienen salida', () => {
    for (const final of ['rechazada', 'completada', 'cancelada'] as const) {
      expect(ESTADOS_SOLICITUD.some((nuevo) => puedeTransicionar(final, nuevo))).toBe(false);
    }
  });
});
