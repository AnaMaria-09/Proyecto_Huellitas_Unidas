import type { EstadoSolicitud } from '../adopcion.model';
import { efectoEnMascota } from './efectos-en-mascota';

describe('efectoEnMascota', () => {
  it.each([
    ['pendiente', 'aprobada', 'en_proceso'],
    ['aprobada', 'completada', 'adoptada'],
    ['aprobada', 'cancelada', 'disponible'],
  ] as [EstadoSolicitud, EstadoSolicitud, string][])('%s → %s deja la mascota %s', (anterior, nuevo, esperado) => {
    expect(efectoEnMascota(anterior, nuevo)).toBe(esperado);
  });

  it.each([
    ['pendiente', 'rechazada'],
    ['pendiente', 'cancelada'],
    ['rechazada', 'aprobada'],
    ['completada', 'cancelada'],
  ] as [EstadoSolicitud, EstadoSolicitud][])('%s → %s no cambia a la mascota', (anterior, nuevo) => {
    expect(efectoEnMascota(anterior, nuevo)).toBeNull();
  });
});
