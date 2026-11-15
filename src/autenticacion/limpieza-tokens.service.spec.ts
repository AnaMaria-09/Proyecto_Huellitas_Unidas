import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { LessThan } from 'typeorm';
import type { DeleteResult, FindOptionsWhere } from 'typeorm';
import { TokenRefresco } from './entities/token-refresco.entity';
import { LimpiezaTokensService } from './limpieza-tokens.service';

const AHORA = new Date('2026-11-15T03:00:00Z');
const HACE_SIETE_DIAS = new Date('2026-11-08T03:00:00Z');

describe('LimpiezaTokensService', () => {
  let borrar: jest.Mock<
    (criterio: FindOptionsWhere<TokenRefresco>) => Promise<DeleteResult>
  >;
  let service: LimpiezaTokensService;

  beforeEach(async () => {
    borrar = jest
      .fn<
        (criterio: FindOptionsWhere<TokenRefresco>) => Promise<DeleteResult>
      >()
      .mockResolvedValueOnce({ raw: [], affected: 3 })
      .mockResolvedValueOnce({ raw: [], affected: 2 });
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const modulo = await Test.createTestingModule({
      providers: [
        LimpiezaTokensService,
        {
          provide: getRepositoryToken(TokenRefresco),
          useValue: { delete: borrar },
        },
      ],
    }).compile();
    service = modulo.get(LimpiezaTokensService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('borra los vencidos y los revocados hace más de 7 días', async () => {
    await service.limpiar(AHORA);

    expect(borrar).toHaveBeenCalledWith({
      expiraEn: LessThan(HACE_SIETE_DIAS),
    });
    expect(borrar).toHaveBeenCalledWith({
      revocadoEn: LessThan(HACE_SIETE_DIAS),
    });
  });

  it('devuelve cuántos tokens borró y lo registra', async () => {
    await expect(service.limpiar(AHORA)).resolves.toBe(5);
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining('5 borrados'),
    );
  });

  it('está programada como tarea diaria', () => {
    // Metadatos que lee ScheduleModule al arrancar (EVERY_DAY_AT_3AM).
    const metadatos = Reflect.getMetadata(
      'SCHEDULE_CRON_OPTIONS',
      LimpiezaTokensService.prototype.limpiar,
    );
    expect(metadatos).toMatchObject({
      cronTime: '0 03 * * *',
      name: 'limpieza-tokens-refresco',
    });
  });
});
