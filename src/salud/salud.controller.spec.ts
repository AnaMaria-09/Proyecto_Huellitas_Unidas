import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { SaludController } from './salud.controller';

describe('SaludController', () => {
  it('revisa la conexión a la base de datos', async () => {
    const resultado: HealthCheckResult = {
      status: 'ok',
      info: { baseDeDatos: { status: 'up' } },
      error: {},
      details: { baseDeDatos: { status: 'up' } },
    };
    // Ejecuta los indicadores que recibe, como HealthCheckService.
    const check = jest.fn(async (indicadores: (() => unknown)[]) => {
      await Promise.all(indicadores.map((indicador) => indicador()));
      return resultado;
    });
    const pingCheck = jest.fn(async (clave: string) => ({
      [clave]: { status: 'up' as const },
    }));
    const modulo = await Test.createTestingModule({
      controllers: [SaludController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        { provide: TypeOrmHealthIndicator, useValue: { pingCheck } },
      ],
    }).compile();

    await expect(modulo.get(SaludController).revisar()).resolves.toBe(
      resultado,
    );
    expect(pingCheck).toHaveBeenCalledWith('baseDeDatos');
  });
});
