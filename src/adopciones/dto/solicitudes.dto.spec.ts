import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConfirmarEntregaDto } from './confirmar-entrega.dto';
import { CrearSolicitudDto } from './crear-solicitud.dto';
import { EvaluarSolicitudDto } from './evaluar-solicitud.dto';
import { FiltroSolicitudesDto } from './filtro-solicitudes.dto';

type ClaseDto<T> = new () => T;

// Devuelve las propiedades con errores de validación.
async function propiedadesConError<T extends object>(clase: ClaseDto<T>, datos: object): Promise<string[]> {
  const errores = await validate(plainToInstance(clase, datos));
  return errores.map((error) => error.property);
}

const MENSAJE_VALIDO = 'Tengo un patio grande y mucho tiempo para cuidarlo.';

describe('DTOs de solicitudes de adopción', () => {
  describe('CrearSolicitudDto', () => {
    it('acepta datos válidos', async () => {
      expect(await propiedadesConError(CrearSolicitudDto, { mascotaId: 3, mensaje: MENSAJE_VALIDO })).toEqual([]);
    });

    it('rechaza un mensaje de menos de 20 caracteres', async () => {
      expect(await propiedadesConError(CrearSolicitudDto, { mascotaId: 3, mensaje: 'Lo quiero' })).toEqual([
        'mensaje',
      ]);
    });

    it('rechaza un mensaje de más de 1000 caracteres', async () => {
      expect(await propiedadesConError(CrearSolicitudDto, { mascotaId: 3, mensaje: 'a'.repeat(1001) })).toEqual([
        'mensaje',
      ]);
    });

    it.each([0, -1, 1.5, '3'])('rechaza mascotaId %p', async (mascotaId) => {
      expect(await propiedadesConError(CrearSolicitudDto, { mascotaId, mensaje: MENSAJE_VALIDO })).toEqual([
        'mascotaId',
      ]);
    });
  });

  describe('EvaluarSolicitudDto', () => {
    it('acepta una aprobación sin motivo', async () => {
      expect(await propiedadesConError(EvaluarSolicitudDto, { decision: 'aprobada' })).toEqual([]);
    });

    it('exige motivo al rechazar', async () => {
      expect(await propiedadesConError(EvaluarSolicitudDto, { decision: 'rechazada' })).toEqual(['motivo']);
    });

    it('acepta un rechazo con motivo válido', async () => {
      expect(
        await propiedadesConError(EvaluarSolicitudDto, { decision: 'rechazada', motivo: 'Vivienda sin espacio' }),
      ).toEqual([]);
    });

    it('rechaza un motivo de menos de 5 caracteres', async () => {
      expect(await propiedadesConError(EvaluarSolicitudDto, { decision: 'rechazada', motivo: 'no' })).toEqual([
        'motivo',
      ]);
    });

    it('rechaza una decisión desconocida', async () => {
      expect(await propiedadesConError(EvaluarSolicitudDto, { decision: 'completada' })).toEqual(['decision']);
    });

    it('rechaza observaciones de más de 1000 caracteres', async () => {
      expect(
        await propiedadesConError(EvaluarSolicitudDto, { decision: 'aprobada', observaciones: 'a'.repeat(1001) }),
      ).toEqual(['observaciones']);
    });
  });

  describe('ConfirmarEntregaDto', () => {
    it('acepta una fecha pasada', async () => {
      expect(await propiedadesConError(ConfirmarEntregaDto, { fechaEntrega: '2025-03-10T15:00:00Z' })).toEqual([]);
    });

    it('rechaza una fecha futura', async () => {
      const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const errores = await validate(plainToInstance(ConfirmarEntregaDto, { fechaEntrega: manana }));

      expect(errores).toHaveLength(1);
      expect(errores[0].constraints).toEqual({ noEsFechaFutura: 'La fecha de entrega no puede ser futura' });
    });

    it('rechaza un texto que no es fecha', async () => {
      expect(await propiedadesConError(ConfirmarEntregaDto, { fechaEntrega: 'ayer' })).toEqual(['fechaEntrega']);
    });
  });

  describe('FiltroSolicitudesDto', () => {
    it('acepta el filtro vacío', async () => {
      expect(await propiedadesConError(FiltroSolicitudesDto, {})).toEqual([]);
    });

    it.each(['pendiente', 'aprobada', 'rechazada', 'completada', 'cancelada'])('acepta el estado %s', async (estado) => {
      expect(await propiedadesConError(FiltroSolicitudesDto, { estado })).toEqual([]);
    });

    it('rechaza un estado desconocido', async () => {
      expect(await propiedadesConError(FiltroSolicitudesDto, { estado: 'archivada' })).toEqual(['estado']);
    });
  });
});
