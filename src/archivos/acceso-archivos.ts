import type { PayloadJwt } from '../autenticacion/usuario.model';
import type { EstadoMascota } from '../mascotas/mascota.model';
import type { Archivo } from './entities/archivo.entity';

// Reglas de acceso a los archivos, sin dependencias de Nest ni de la base de datos.

export function esAdministrador(usuario?: PayloadJwt): boolean {
  return usuario?.rol === 'administrador';
}

// Quien subió el archivo o un administrador: puede verlo siempre y eliminarlo.
export function puedeGestionarArchivo(archivo: Archivo, usuario?: PayloadJwt): boolean {
  return esAdministrador(usuario) || archivo.propietarioId === usuario?.sub;
}

// Las imágenes de una mascota disponible son públicas; si no está disponible,
// solo las ven la fundación dueña y los administradores.
export function puedeVerImagenesDeMascota(
  mascota: { fundacionId: number; estado: EstadoMascota },
  usuario?: PayloadJwt,
): boolean {
  return mascota.estado === 'disponible' || esAdministrador(usuario) || mascota.fundacionId === usuario?.sub;
}
