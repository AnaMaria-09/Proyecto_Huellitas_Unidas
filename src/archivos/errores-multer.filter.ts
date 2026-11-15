import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Mensajes que multer (vía @nestjs/platform-express) produce en inglés. Para traducir otro, se agrega aquí.
const TRADUCCIONES: Readonly<Record<string, string>> = {
  'File too large': 'El archivo supera el tamaño máximo permitido',
  'Too many files': 'Se enviaron más archivos de los permitidos',
  'Unexpected file field': 'Campo de archivo no esperado',
  'Too many parts': 'El formulario tiene demasiadas partes',
  'Too many fields': 'El formulario tiene demasiados campos',
  'Field name too long': 'El nombre de un campo es demasiado largo',
  'Field value too long': 'El valor de un campo es demasiado largo',
  'Field name missing': 'Falta el nombre de un campo del formulario',
  'Multipart: Boundary not found': 'El formulario multipart no es válido',
  'Multipart: Malformed part header': 'El formulario multipart no es válido',
  'Multipart: Unexpected end of form': 'El formulario multipart está incompleto',
  'Multipart: Unexpected end of file': 'El formulario multipart está incompleto',
};

// multer agrega " - <campo>" al final de algunos mensajes; el campo se conserva.
export function traducirMensajeMulter(mensaje: string): string | undefined {
  const [original, campo] = mensaje.split(' - ');
  const traducido = TRADUCCIONES[original];
  if (!traducido) {
    return undefined;
  }
  return campo ? `${traducido}: ${campo}` : traducido;
}

// Traduce al español los errores de multer; las demás excepciones pasan sin cambios.
@Catch(HttpException)
export class ErroresMulterFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const cuerpo = exception.getResponse();
    const mensaje = typeof cuerpo === 'object' && 'message' in cuerpo ? cuerpo.message : cuerpo;
    const traducido = typeof mensaje === 'string' ? traducirMensajeMulter(mensaje) : undefined;
    if (!traducido) {
      super.catch(exception, host);
      return;
    }
    const base = typeof cuerpo === 'object' ? cuerpo : { statusCode: exception.getStatus() };
    super.catch(new HttpException({ ...base, message: traducido }, exception.getStatus()), host);
  }
}
