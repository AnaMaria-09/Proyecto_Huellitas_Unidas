import { Readable } from 'node:stream';
import { jest } from '@jest/globals';
import { StreamableFile } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Mocked } from 'jest-mock';
import { AutenticacionOpcionalGuard } from '../autenticacion/guards/autenticacion-opcional.guard';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { ArchivosController } from './archivos.controller';
import { ArchivosService } from './archivos.service';

const FUNDACION: PayloadJwt = { sub: 1, rol: 'fundacion', email: 'fundacion@test.com' };
const PERMITIR = { canActivate: () => true };

describe('ArchivosController', () => {
  let controller: ArchivosController;
  let servicio: Mocked<Pick<ArchivosService, 'subirImagenes' | 'descargar'>>;

  beforeEach(async () => {
    servicio = {
      subirImagenes: jest.fn<ArchivosService['subirImagenes']>().mockResolvedValue([]),
      descargar: jest.fn<ArchivosService['descargar']>(),
    };
    const modulo = await Test.createTestingModule({
      controllers: [ArchivosController],
      providers: [{ provide: ArchivosService, useValue: servicio }],
    })
      .overrideGuard(AutenticadoGuard)
      .useValue(PERMITIR)
      .overrideGuard(RolesGuard)
      .useValue(PERMITIR)
      .overrideGuard(AutenticacionOpcionalGuard)
      .useValue(PERMITIR)
      .compile();
    controller = modulo.get(ArchivosController);
  });

  it('envía una lista vacía al servicio si no llegaron imágenes', async () => {
    await controller.subirImagenes(FUNDACION, { mascotaId: 4 }, undefined);

    expect(servicio.subirImagenes).toHaveBeenCalledWith(FUNDACION, 4, []);
  });

  it('transmite la descarga con el tipo del archivo e inline con la clave como nombre', async () => {
    servicio.descargar.mockResolvedValue({
      contenido: Readable.from(Buffer.from('contenido')),
      tipoMime: 'image/png',
      clave: 'abc.png',
    });

    const respuesta = await controller.descargar(7, { expira: 123, firma: 'firma' });

    expect(servicio.descargar).toHaveBeenCalledWith(7, 123, 'firma');
    expect(respuesta).toBeInstanceOf(StreamableFile);
    expect(respuesta.getHeaders()).toMatchObject({ type: 'image/png', disposition: 'inline; filename="abc.png"' });
  });
});
