export type CategoriaArchivo = 'imagen' | 'documento';

// Secuencia de bytes que debe aparecer en una posición del archivo.
export interface FirmaBytes {
  desplazamiento: number;
  bytes: readonly number[];
}

export interface ReglaCategoria {
  tamanoMaximoBytes: number;
  // Tipo MIME permitido → firmas que deben cumplirse TODAS (magic numbers).
  tipos: Readonly<Record<string, readonly FirmaBytes[]>>;
}

export type ReglasArchivos = Readonly<Record<CategoriaArchivo, ReglaCategoria>>;

const MEGABYTE = 1024 * 1024;

function ascii(texto: string): number[] {
  return [...Buffer.from(texto, 'ascii')];
}

// Para permitir un tipo nuevo se agrega aquí; ValidadorArchivos no cambia.
export const REGLAS_ARCHIVOS: ReglasArchivos = {
  imagen: {
    tamanoMaximoBytes: 5 * MEGABYTE,
    tipos: {
      'image/jpeg': [{ desplazamiento: 0, bytes: [0xff, 0xd8, 0xff] }],
      'image/png': [{ desplazamiento: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
      'image/webp': [
        { desplazamiento: 0, bytes: ascii('RIFF') },
        { desplazamiento: 8, bytes: ascii('WEBP') },
      ],
    },
  },
  documento: {
    tamanoMaximoBytes: 10 * MEGABYTE,
    tipos: {
      'application/pdf': [{ desplazamiento: 0, bytes: ascii('%PDF-') }],
    },
  },
};

export const REGLAS_VALIDACION_ARCHIVOS = Symbol('REGLAS_VALIDACION_ARCHIVOS');
