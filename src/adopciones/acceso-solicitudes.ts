import type { PayloadJwt } from '../autenticacion/usuario.model';

// Reglas de acceso a las solicitudes, sin dependencias de Nest ni de la base de datos.

interface SolicitudConDueno {
  adoptanteId: number;
  mascota?: { fundacionId: number };
}

export function esAdoptante(
  solicitud: SolicitudConDueno,
  usuario: PayloadJwt,
): boolean {
  return solicitud.adoptanteId === usuario.sub;
}

export function esFundacionDuena(
  mascota: { fundacionId: number },
  usuario: PayloadJwt,
): boolean {
  return mascota.fundacionId === usuario.sub;
}

// El adoptante, la fundación dueña de la mascota o un administrador.
export function puedeVerSolicitud(
  solicitud: SolicitudConDueno,
  usuario: PayloadJwt,
): boolean {
  return (
    usuario.rol === 'administrador' ||
    esAdoptante(solicitud, usuario) ||
    (solicitud.mascota !== undefined &&
      esFundacionDuena(solicitud.mascota, usuario))
  );
}
