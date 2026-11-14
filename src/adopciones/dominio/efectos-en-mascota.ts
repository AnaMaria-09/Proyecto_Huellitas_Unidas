import type { EstadoSolicitud } from '../adopcion.model';

export type EstadoMascotaResultante = 'en_proceso' | 'adoptada' | 'disponible';

// Qué le pasa a la mascota cuando su solicitud cambia de estado.
// Clave: "<estado anterior>→<estado nuevo>". Las transiciones que no aparecen no cambian a la mascota.
const EFECTOS_EN_MASCOTA: Readonly<Partial<Record<`${EstadoSolicitud}→${EstadoSolicitud}`, EstadoMascotaResultante>>> = {
  'pendiente→aprobada': 'en_proceso',
  'aprobada→completada': 'adoptada',
  'aprobada→cancelada': 'disponible',
};

export function efectoEnMascota(
  estadoAnteriorSolicitud: EstadoSolicitud,
  estadoNuevoSolicitud: EstadoSolicitud,
): EstadoMascotaResultante | null {
  return EFECTOS_EN_MASCOTA[`${estadoAnteriorSolicitud}→${estadoNuevoSolicitud}`] ?? null;
}
