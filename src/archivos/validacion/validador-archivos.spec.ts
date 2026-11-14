import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { REGLAS_ARCHIVOS } from './reglas-archivos';
import type { ReglasArchivos } from './reglas-archivos';
import { ValidadorArchivos } from './validador-archivos';

const MEGABYTE = 1024 * 1024;

// Arma un buffer con la cabecera indicada y relleno hasta el tamaño pedido.
function conCabecera(cabecera: number[], tamano = 64): Buffer {
  const buffer = Buffer.alloc(Math.max(tamano, cabecera.length));
  Buffer.from(cabecera).copy(buffer);
  return buffer;
}

const JPEG = conCabecera([0xff, 0xd8, 0xff, 0xe0]);
const PNG = conCabecera([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = conCabecera([...Buffer.from('RIFF'), 0x24, 0x00, 0x00, 0x00, ...Buffer.from('WEBPVP8 ')]);
const PDF = conCabecera([...Buffer.from('%PDF-1.7')]);

describe('ValidadorArchivos', () => {
  const validador = new ValidadorArchivos(REGLAS_ARCHIVOS);

  describe('acepta archivos válidos', () => {
    it.each([
      ['image/jpeg', JPEG],
      ['image/png', PNG],
      ['image/webp', WEBP],
    ])('imagen %s', (mimetype, buffer) => {
      expect(() => validador.validar({ buffer, mimetype }, 'imagen')).not.toThrow();
    });

    it('documento application/pdf', () => {
      expect(() => validador.validar({ buffer: PDF, mimetype: 'application/pdf' }, 'documento')).not.toThrow();
    });
  });

  describe('rechaza archivos inválidos', () => {
    it('un .png que en realidad es un PDF', () => {
      expect(() => validador.validar({ buffer: PDF, mimetype: 'image/png' }, 'imagen')).toThrow(
        BadRequestException,
      );
    });

    it('un WEBP con "RIFF" pero sin "WEBP" en los bytes 8 a 11', () => {
      const falso = conCabecera([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WAVE')]);
      expect(() => validador.validar({ buffer: falso, mimetype: 'image/webp' }, 'imagen')).toThrow(
        BadRequestException,
      );
    });

    it('un archivo más corto que su firma', () => {
      expect(() => validador.validar({ buffer: Buffer.from([0xff]), mimetype: 'image/jpeg' }, 'imagen')).toThrow(
        BadRequestException,
      );
    });

    it('una imagen de más de 5 MB', () => {
      const grande = conCabecera([0xff, 0xd8, 0xff], 5 * MEGABYTE + 1);
      expect(() => validador.validar({ buffer: grande, mimetype: 'image/jpeg' }, 'imagen')).toThrow(
        PayloadTooLargeException,
      );
    });

    it('un PDF de más de 10 MB', () => {
      const grande = conCabecera([...Buffer.from('%PDF-')], 10 * MEGABYTE + 1);
      expect(() => validador.validar({ buffer: grande, mimetype: 'application/pdf' }, 'documento')).toThrow(
        PayloadTooLargeException,
      );
    });

    it('un tipo no permitido', () => {
      expect(() => validador.validar({ buffer: PNG, mimetype: 'image/gif' }, 'imagen')).toThrow(
        BadRequestException,
      );
    });

    it('un PDF enviado como imagen', () => {
      expect(() => validador.validar({ buffer: PDF, mimetype: 'application/pdf' }, 'imagen')).toThrow(
        BadRequestException,
      );
    });
  });

  it('admite reglas nuevas sin modificar el validador', () => {
    const reglas: ReglasArchivos = {
      ...REGLAS_ARCHIVOS,
      documento: {
        tamanoMaximoBytes: MEGABYTE,
        tipos: { 'application/zip': [{ desplazamiento: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }] },
      },
    };
    const conZip = new ValidadorArchivos(reglas);

    expect(() =>
      conZip.validar({ buffer: conCabecera([0x50, 0x4b, 0x03, 0x04]), mimetype: 'application/zip' }, 'documento'),
    ).not.toThrow();
  });
});
