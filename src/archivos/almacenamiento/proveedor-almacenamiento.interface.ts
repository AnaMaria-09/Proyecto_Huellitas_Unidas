import type { Readable } from 'node:stream';

export interface ArchivoGuardado {
  clave: string;
}

/**
 * Contrato de cualquier almacenamiento de archivos (disco local, nube, etc.).
 * Toda implementación debe respetar los mismos tipos de retorno y excepciones
 * para que puedan reemplazarse entre sí:
 * - Una clave inválida lanza BadRequestException.
 * - obtener y eliminar lanzan NotFoundException si la clave no existe.
 */
export interface ProveedorAlmacenamiento {
  guardar(buffer: Buffer, tipoMime: string): Promise<ArchivoGuardado>;
  obtener(clave: string): Promise<Readable>;
  eliminar(clave: string): Promise<void>;
  existe(clave: string): Promise<boolean>;
}
