import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { NotFoundException } from '@nestjs/common';
import type { ArchivoGuardado, ProveedorAlmacenamiento } from '../almacenamiento/proveedor-almacenamiento.interface';

// Solo para pruebas unitarias: guarda los archivos en memoria y respeta el contrato de ProveedorAlmacenamiento.
export class AlmacenamientoFake implements ProveedorAlmacenamiento {
  readonly archivos = new Map<string, Buffer>();

  async guardar(buffer: Buffer, _tipoMime: string): Promise<ArchivoGuardado> {
    const clave = `${randomUUID()}.bin`;
    this.archivos.set(clave, buffer);
    return { clave };
  }

  async obtener(clave: string): Promise<Readable> {
    const contenido = this.archivos.get(clave);
    if (!contenido) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    return Readable.from(contenido);
  }

  async eliminar(clave: string): Promise<void> {
    if (!this.archivos.delete(clave)) {
      throw new NotFoundException('El archivo que intentas eliminar no existe');
    }
  }

  async existe(clave: string): Promise<boolean> {
    return this.archivos.has(clave);
  }
}
