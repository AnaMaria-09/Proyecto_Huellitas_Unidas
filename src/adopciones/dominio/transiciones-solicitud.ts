import { ConflictException } from '@nestjs/common';
import type { EstadoSolicitud } from '../adopcion.model';

// Estados a los que puede pasar una solicitud desde cada estado actual.
export const TRANSICIONES_SOLICITUD: Readonly<Record<EstadoSolicitud, readonly EstadoSolicitud[]>> = {
  pendiente: ['aprobada', 'rechazada', 'cancelada'],
  aprobada: ['completada', 'cancelada'],
  rechazada: [],
  completada: [],
  cancelada: [],
};

// Un ciudadano solo puede tener una solicitud en estos estados por mascota.
export const ESTADOS_ACTIVOS: readonly EstadoSolicitud[] = ['pendiente', 'aprobada'];

export function puedeTransicionar(actual: EstadoSolicitud, nuevo: EstadoSolicitud): boolean {
  return TRANSICIONES_SOLICITUD[actual].includes(nuevo);
}

export function validarTransicion(actual: EstadoSolicitud, nuevo: EstadoSolicitud): void {
  if (!puedeTransicionar(actual, nuevo)) {
    throw new ConflictException(
      `No se puede pasar una solicitud del estado '${actual}' al estado '${nuevo}'`,
    );
  }
}
