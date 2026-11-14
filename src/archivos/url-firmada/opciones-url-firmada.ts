export interface OpcionesUrlFirmada {
  secreto: string;
  expiraSegundos: number;
}

export const OPCIONES_URL_FIRMADA = Symbol('OPCIONES_URL_FIRMADA');
