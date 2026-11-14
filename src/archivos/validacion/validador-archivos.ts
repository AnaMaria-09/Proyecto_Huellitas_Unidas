import { BadRequestException, Inject, Injectable, PayloadTooLargeException } from '@nestjs/common';
import type { CategoriaArchivo, FirmaBytes, ReglasArchivos } from './reglas-archivos';
import { REGLAS_VALIDACION_ARCHIVOS } from './reglas-archivos';

// Forma mínima de un archivo recibido; compatible con el objeto que entrega multer.
export interface ArchivoEntrante {
  buffer: Buffer;
  mimetype: string;
}

// Única responsabilidad: decidir si un archivo cumple las reglas de su categoría.
@Injectable()
export class ValidadorArchivos {
  constructor(@Inject(REGLAS_VALIDACION_ARCHIVOS) private readonly reglas: ReglasArchivos) {}

  validar(archivo: ArchivoEntrante, categoria: CategoriaArchivo): void {
    const regla = this.reglas[categoria];
    const firmas = regla.tipos[archivo.mimetype];
    if (!firmas) {
      const permitidos = Object.keys(regla.tipos).join(', ');
      throw new BadRequestException(
        `El tipo ${archivo.mimetype} no está permitido para ${categoria}. Tipos permitidos: ${permitidos}`,
      );
    }

    // Se mide el contenido real, no el tamaño que declara el cliente.
    if (archivo.buffer.length > regla.tamanoMaximoBytes) {
      const maximoMb = regla.tamanoMaximoBytes / (1024 * 1024);
      throw new PayloadTooLargeException(`El archivo supera el tamaño máximo de ${maximoMb} MB`);
    }

    if (!firmas.every((firma) => coincideFirma(archivo.buffer, firma))) {
      throw new BadRequestException(
        `El contenido del archivo no corresponde al tipo declarado (${archivo.mimetype})`,
      );
    }
  }
}

function coincideFirma(buffer: Buffer, firma: FirmaBytes): boolean {
  if (buffer.length < firma.desplazamiento + firma.bytes.length) {
    return false;
  }
  return firma.bytes.every((byte, indice) => buffer[firma.desplazamiento + indice] === byte);
}
