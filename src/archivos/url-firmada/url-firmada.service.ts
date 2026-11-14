import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { OPCIONES_URL_FIRMADA } from './opciones-url-firmada';
import type { OpcionesUrlFirmada } from './opciones-url-firmada';

export const LONGITUD_MINIMA_SECRETO = 32;

export interface FirmaUrl {
  expira: number;
  firma: string;
}

// Firma y verifica URLs temporales de archivos con HMAC-SHA256 sobre "archivoId:expira".
@Injectable()
export class UrlFirmadaService {
  constructor(@Inject(OPCIONES_URL_FIRMADA) private readonly opciones: OpcionesUrlFirmada) {
    if (opciones.secreto.length < LONGITUD_MINIMA_SECRETO) {
      throw new Error(
        `El secreto de las URLs firmadas debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres`,
      );
    }
    if (!Number.isInteger(opciones.expiraSegundos) || opciones.expiraSegundos <= 0) {
      throw new Error('La vigencia de las URLs firmadas debe ser un número entero positivo de segundos');
    }
  }

  // "ahora" se puede inyectar para probar la expiración sin esperar.
  firmar(archivoId: number, ahora: Date = new Date()): FirmaUrl {
    const expira = enSegundos(ahora) + this.opciones.expiraSegundos;
    return { expira, firma: this.calcularFirma(archivoId, expira) };
  }

  verificar(archivoId: number, expira: number, firma: string, ahora: Date = new Date()): boolean {
    if (!Number.isInteger(expira) || expira < enSegundos(ahora)) {
      return false;
    }

    const esperada = Buffer.from(this.calcularFirma(archivoId, expira), 'utf8');
    const recibida = Buffer.from(firma, 'utf8');
    // timingSafeEqual exige la misma longitud; si difiere, la firma ya es inválida.
    if (esperada.length !== recibida.length) {
      return false;
    }
    return timingSafeEqual(esperada, recibida);
  }

  private calcularFirma(archivoId: number, expira: number): string {
    return createHmac('sha256', this.opciones.secreto).update(`${archivoId}:${expira}`).digest('base64url');
  }
}

function enSegundos(fecha: Date): number {
  return Math.floor(fecha.getTime() / 1000);
}
