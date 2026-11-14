import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EXTENSIONES_POR_TIPO } from './extensiones-por-tipo';
import type { OpcionesAlmacenamiento } from './opciones-almacenamiento.interface';
import type { ArchivoGuardado, ProveedorAlmacenamiento } from './proveedor-almacenamiento.interface';
import { OPCIONES_ALMACENAMIENTO } from './tokens';

// Guarda los archivos en un directorio del disco local.
@Injectable()
export class AlmacenamientoLocal implements ProveedorAlmacenamiento {
  private readonly directorio: string;

  constructor(@Inject(OPCIONES_ALMACENAMIENTO) opciones: OpcionesAlmacenamiento) {
    this.directorio = path.resolve(opciones.directorio);
  }

  async guardar(buffer: Buffer, tipoMime: string): Promise<ArchivoGuardado> {
    const extension = EXTENSIONES_POR_TIPO[tipoMime];
    if (!extension) {
      throw new BadRequestException(`El tipo de archivo ${tipoMime} no se puede almacenar`);
    }

    await mkdir(this.directorio, { recursive: true });
    // Nunca se usa el nombre original del archivo: se genera uno aleatorio.
    const clave = `${randomUUID()}.${extension}`;
    await writeFile(this.resolverRuta(clave), buffer, { flag: 'wx' });
    return { clave };
  }

  async obtener(clave: string): Promise<Readable> {
    const ruta = this.resolverRuta(clave);
    if (!(await this.existe(clave))) {
      throw new NotFoundException('El archivo solicitado no existe');
    }
    return createReadStream(ruta);
  }

  async eliminar(clave: string): Promise<void> {
    const ruta = this.resolverRuta(clave);
    try {
      await unlink(ruta);
    } catch (error) {
      if (esArchivoInexistente(error)) {
        throw new NotFoundException('El archivo que intentas eliminar no existe');
      }
      throw error;
    }
  }

  async existe(clave: string): Promise<boolean> {
    const ruta = this.resolverRuta(clave);
    try {
      const informacion = await stat(ruta);
      return informacion.isFile();
    } catch (error) {
      if (esArchivoInexistente(error)) {
        return false;
      }
      throw error;
    }
  }

  // Protección contra path traversal: la clave es un nombre plano y la ruta final queda dentro del directorio.
  private resolverRuta(clave: string): string {
    if (!clave || /[/\\0]/.test(clave) || clave.includes('..')) {
      throw new BadRequestException('La clave del archivo no es válida');
    }
    const ruta = path.resolve(this.directorio, clave);
    if (path.dirname(ruta) !== this.directorio) {
      throw new BadRequestException('La clave del archivo no es válida');
    }
    return ruta;
  }
}

function esArchivoInexistente(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}
