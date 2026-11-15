import { jest } from '@jest/globals';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { Mascota } from '../mascotas/entities/mascota.entity';
import type { EstadoMascota } from '../mascotas/mascota.model';
import { MascotasService } from '../mascotas/mascotas.service';
import { RepositorioMascotasFake } from '../mascotas/testing/repositorio-mascotas.fake';
import {
  AdopcionesService,
  MOTIVO_ASIGNADA_A_OTRA,
} from './adopciones.service';
import type { EstadoSolicitud } from './adopcion.model';
import { HistorialSolicitud } from './entities/historial-solicitud.entity';
import { SolicitudAdopcion } from './entities/solicitud-adopcion.entity';
import { HistorialSolicitudesService } from './historial-solicitudes.service';
import { RepositorioMemoria } from './testing/repositorio-memoria.fake';

const ADMIN: PayloadJwt = {
  sub: 1,
  rol: 'administrador',
  email: 'admin@test.com',
};
const FUNDACION: PayloadJwt = {
  sub: 10,
  rol: 'fundacion',
  email: 'fundacion@test.com',
};
const OTRA_FUNDACION: PayloadJwt = {
  sub: 11,
  rol: 'fundacion',
  email: 'otra@test.com',
};
const CIUDADANO: PayloadJwt = {
  sub: 20,
  rol: 'ciudadano',
  email: 'ana@test.com',
};
const OTRO_CIUDADANO: PayloadJwt = {
  sub: 21,
  rol: 'ciudadano',
  email: 'luis@test.com',
};

const MENSAJE = 'Tengo un patio grande y mucho tiempo para cuidarla.';
const PAGINA = { pagina: 1, limite: 20 };

describe('AdopcionesService', () => {
  let mascotasRepo: RepositorioMascotasFake;
  let solicitudes: RepositorioMemoria<SolicitudAdopcion>;
  let historial: RepositorioMemoria<HistorialSolicitud>;
  let transaction: jest.Mock<
    (trabajo: (manager: EntityManager) => Promise<unknown>) => Promise<unknown>
  >;
  let cambiarEstadoPorSistema: jest.Mock<
    MascotasService['cambiarEstadoPorSistema']
  >;
  let service: AdopcionesService;

  beforeEach(async () => {
    mascotasRepo = new RepositorioMascotasFake();
    solicitudes = new RepositorioMemoria(
      () => new SolicitudAdopcion(),
      async (solicitud) => {
        solicitud.mascota =
          (await mascotasRepo.findOneBy({ id: solicitud.mascotaId })) ??
          undefined;
        return solicitud;
      },
    );
    historial = new RepositorioMemoria(() => new HistorialSolicitud());

    const manager = {
      getRepository: (entidad: unknown) => {
        if (entidad === SolicitudAdopcion) return solicitudes;
        if (entidad === HistorialSolicitud) return historial;
        if (entidad === Mascota) return mascotasRepo;
        throw new Error('Entidad inesperada');
      },
    } as unknown as EntityManager;
    transaction = jest.fn((trabajo) => trabajo(manager));

    // Simula MascotasService: aplica el estado en el repositorio de mascotas.
    cambiarEstadoPorSistema = jest.fn<
      MascotasService['cambiarEstadoPorSistema']
    >(async (id, estado) => {
      const mascota = await mascotasRepo.findOneBy({ id });
      if (!mascota) throw new NotFoundException();
      mascota.estado = estado;
      return mascotasRepo.save(mascota);
    });

    const modulo = await Test.createTestingModule({
      providers: [
        AdopcionesService,
        HistorialSolicitudesService,
        {
          provide: getRepositoryToken(SolicitudAdopcion),
          useValue: solicitudes,
        },
        {
          provide: getRepositoryToken(HistorialSolicitud),
          useValue: historial,
        },
        { provide: getDataSourceToken(), useValue: { transaction } },
        { provide: MascotasService, useValue: { cambiarEstadoPorSistema } },
      ],
    }).compile();
    service = modulo.get(AdopcionesService);
  });

  async function crearMascota(
    estado: EstadoMascota = 'disponible',
  ): Promise<Mascota> {
    return mascotasRepo.save(
      mascotasRepo.create({
        nombre: 'Luna',
        fundacionId: FUNDACION.sub,
        estado,
      }),
    );
  }

  async function estadoMascota(id: number): Promise<EstadoMascota | undefined> {
    return (await mascotasRepo.findOneBy({ id }))?.estado;
  }

  async function estadoSolicitud(
    id: number,
  ): Promise<EstadoSolicitud | undefined> {
    return (await solicitudes.findOneBy({ id }))?.estado;
  }

  function historialDe(
    solicitudId: number,
  ): [EstadoSolicitud | null, EstadoSolicitud][] {
    return historial
      .todas()
      .filter((registro) => registro.solicitudId === solicitudId)
      .map((registro) => [registro.estadoAnterior, registro.estadoNuevo]);
  }

  async function solicitudAprobada(): Promise<{
    mascota: Mascota;
    solicitud: SolicitudAdopcion;
  }> {
    const mascota = await crearMascota();
    const solicitud = await service.crear(CIUDADANO, {
      mascotaId: mascota.id,
      mensaje: MENSAJE,
    });
    await service.evaluar(solicitud.id, FUNDACION, { decision: 'aprobada' });
    return { mascota, solicitud };
  }

  describe('crear', () => {
    it('guarda la solicitud pendiente del ciudadano y registra el historial inicial', async () => {
      const mascota = await crearMascota();

      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      expect(solicitud).toMatchObject({
        mascotaId: mascota.id,
        adoptanteId: CIUDADANO.sub,
        estado: 'pendiente',
      });
      expect(historialDe(solicitud.id)).toEqual([[null, 'pendiente']]);
      expect(historial.todas()[0].usuarioId).toBe(CIUDADANO.sub);
      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it.each<EstadoMascota>(['en_proceso', 'adoptada'])(
      'lanza 409 si la mascota está %s',
      async (estado) => {
        const mascota = await crearMascota(estado);

        await expect(
          service.crear(CIUDADANO, { mascotaId: mascota.id, mensaje: MENSAJE }),
        ).rejects.toThrow(ConflictException);
        expect(solicitudes.todas()).toHaveLength(0);
      },
    );

    it('lanza 404 si la mascota no existe', async () => {
      await expect(
        service.crear(CIUDADANO, { mascotaId: 999, mensaje: MENSAJE }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza 409 si el ciudadano ya tiene una solicitud activa para la mascota', async () => {
      const mascota = await crearMascota();
      await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(
        service.crear(CIUDADANO, { mascotaId: mascota.id, mensaje: MENSAJE }),
      ).rejects.toThrow(/Ya tienes una solicitud activa/);
      expect(solicitudes.todas()).toHaveLength(1);
    });

    it('permite una nueva solicitud si la anterior se canceló', async () => {
      const mascota = await crearMascota();
      const primera = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });
      await service.cancelar(primera.id, CIUDADANO);

      await expect(
        service.crear(CIUDADANO, { mascotaId: mascota.id, mensaje: MENSAJE }),
      ).resolves.toMatchObject({
        estado: 'pendiente',
      });
    });

    it('otro ciudadano puede pedir la misma mascota', async () => {
      const mascota = await crearMascota();
      await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(
        service.crear(OTRO_CIUDADANO, {
          mascotaId: mascota.id,
          mensaje: MENSAJE,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('evaluar', () => {
    it('lanza 403 si la fundación no es dueña de la mascota', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(
        service.evaluar(solicitud.id, OTRA_FUNDACION, { decision: 'aprobada' }),
      ).rejects.toThrow(ForbiddenException);
      expect(await estadoSolicitud(solicitud.id)).toBe('pendiente');
    });

    it('lanza 404 si la solicitud no existe', async () => {
      await expect(
        service.evaluar(999, FUNDACION, { decision: 'aprobada' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('al rechazar guarda el motivo y no cambia a la mascota', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      const rechazada = await service.evaluar(solicitud.id, FUNDACION, {
        decision: 'rechazada',
        motivo: 'Vivienda sin espacio',
      });

      expect(rechazada).toMatchObject({
        estado: 'rechazada',
        motivoRechazo: 'Vivienda sin espacio',
      });
      expect(cambiarEstadoPorSistema).not.toHaveBeenCalled();
      expect(historialDe(solicitud.id)).toEqual([
        [null, 'pendiente'],
        ['pendiente', 'rechazada'],
      ]);
    });

    it('al aprobar pone la mascota en_proceso y rechaza las demás pendientes en la misma transacción', async () => {
      const mascota = await crearMascota();
      const otraMascota = await mascotasRepo.save(
        mascotasRepo.create({
          nombre: 'Max',
          fundacionId: FUNDACION.sub,
          estado: 'disponible',
        }),
      );
      const elegida = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });
      const competidora = await service.crear(OTRO_CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });
      const deOtraMascota = await service.crear(OTRO_CIUDADANO, {
        mascotaId: otraMascota.id,
        mensaje: MENSAJE,
      });
      transaction.mockClear();

      const aprobada = await service.evaluar(elegida.id, FUNDACION, {
        decision: 'aprobada',
        observaciones: 'Visita ok',
      });

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(aprobada).toMatchObject({
        estado: 'aprobada',
        observaciones: 'Visita ok',
      });
      expect(cambiarEstadoPorSistema).toHaveBeenCalledWith(
        mascota.id,
        'en_proceso',
        expect.anything(),
      );
      expect(await estadoMascota(mascota.id)).toBe('en_proceso');

      const rechazada = await solicitudes.findOneBy({ id: competidora.id });
      expect(rechazada).toMatchObject({
        estado: 'rechazada',
        motivoRechazo: MOTIVO_ASIGNADA_A_OTRA,
      });
      expect(historialDe(competidora.id)).toEqual([
        [null, 'pendiente'],
        ['pendiente', 'rechazada'],
      ]);
      expect(await estadoSolicitud(deOtraMascota.id)).toBe('pendiente');
      expect(await estadoMascota(otraMascota.id)).toBe('disponible');
    });

    it('lanza 409 al evaluar una solicitud ya rechazada', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });
      await service.evaluar(solicitud.id, FUNDACION, {
        decision: 'rechazada',
        motivo: 'Vivienda sin espacio',
      });

      await expect(
        service.evaluar(solicitud.id, FUNDACION, { decision: 'aprobada' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmarEntrega', () => {
    it('completa la solicitud aprobada, guarda la fecha y deja la mascota adoptada', async () => {
      const { mascota, solicitud } = await solicitudAprobada();

      const completada = await service.confirmarEntrega(
        solicitud.id,
        FUNDACION,
        {
          fechaEntrega: '2026-11-10T15:00:00Z',
        },
      );

      expect(completada).toMatchObject({
        estado: 'completada',
        fechaEntrega: new Date('2026-11-10T15:00:00Z'),
      });
      expect(cambiarEstadoPorSistema).toHaveBeenLastCalledWith(
        mascota.id,
        'adoptada',
        expect.anything(),
      );
      expect(await estadoMascota(mascota.id)).toBe('adoptada');
    });

    it('lanza 409 si la solicitud sigue pendiente', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(
        service.confirmarEntrega(solicitud.id, FUNDACION, {
          fechaEntrega: '2026-11-10T15:00:00Z',
        }),
      ).rejects.toThrow(ConflictException);
      expect(await estadoMascota(mascota.id)).toBe('disponible');
    });

    it('lanza 403 si la fundación no es dueña', async () => {
      const { solicitud } = await solicitudAprobada();

      await expect(
        service.confirmarEntrega(solicitud.id, OTRA_FUNDACION, {
          fechaEntrega: '2026-11-10T15:00:00Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelar', () => {
    it('cancela una aprobada y la mascota vuelve a estar disponible', async () => {
      const { mascota, solicitud } = await solicitudAprobada();

      await service.cancelar(solicitud.id, CIUDADANO);

      expect(await estadoSolicitud(solicitud.id)).toBe('cancelada');
      expect(cambiarEstadoPorSistema).toHaveBeenLastCalledWith(
        mascota.id,
        'disponible',
        expect.anything(),
      );
      expect(await estadoMascota(mascota.id)).toBe('disponible');
    });

    it('cancela una pendiente sin cambiar a la mascota y no borra la fila', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await service.cancelar(solicitud.id, CIUDADANO);

      expect(await estadoSolicitud(solicitud.id)).toBe('cancelada');
      expect(cambiarEstadoPorSistema).not.toHaveBeenCalled();
    });

    it('lanza 409 al cancelar una completada', async () => {
      const { solicitud } = await solicitudAprobada();
      await service.confirmarEntrega(solicitud.id, FUNDACION, {
        fechaEntrega: '2026-11-10T15:00:00Z',
      });

      await expect(service.cancelar(solicitud.id, CIUDADANO)).rejects.toThrow(
        ConflictException,
      );
      expect(await estadoSolicitud(solicitud.id)).toBe('completada');
    });

    it('lanza 404 si quien cancela no es el adoptante', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(
        service.cancelar(solicitud.id, OTRO_CIUDADANO),
      ).rejects.toThrow(NotFoundException);
      expect(await estadoSolicitud(solicitud.id)).toBe('pendiente');
    });
  });

  describe('obtener', () => {
    it.each([
      ['el adoptante', CIUDADANO],
      ['la fundación dueña', FUNDACION],
      ['un administrador', ADMIN],
    ])('%s puede verla', async (_quien, usuario) => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(
        service.obtener(solicitud.id, usuario),
      ).resolves.toMatchObject({ id: solicitud.id });
    });

    it.each([
      ['otro ciudadano', OTRO_CIUDADANO],
      ['otra fundación', OTRA_FUNDACION],
    ])('%s recibe 404', async (_quien, usuario) => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });

      await expect(service.obtener(solicitud.id, usuario)).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.listarHistorial(solicitud.id, usuario),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('historial', () => {
    it('registra cada cambio de estado con quién lo hizo', async () => {
      const { solicitud } = await solicitudAprobada();
      await service.confirmarEntrega(solicitud.id, FUNDACION, {
        fechaEntrega: '2026-11-10T15:00:00Z',
      });

      expect(historialDe(solicitud.id)).toEqual([
        [null, 'pendiente'],
        ['pendiente', 'aprobada'],
        ['aprobada', 'completada'],
      ]);
      expect(historial.todas().map((registro) => registro.usuarioId)).toEqual([
        CIUDADANO.sub,
        FUNDACION.sub,
        FUNDACION.sub,
      ]);
    });

    it('lista el historial ordenado por fecha', async () => {
      const mascota = await crearMascota();
      const solicitud = await service.crear(CIUDADANO, {
        mascotaId: mascota.id,
        mensaje: MENSAJE,
      });
      const find = jest.spyOn(historial, 'find');

      await service.listarHistorial(solicitud.id, CIUDADANO);

      expect(find).toHaveBeenCalledWith({
        where: { solicitudId: solicitud.id },
        order: { creadoEn: 'ASC', id: 'ASC' },
      });
    });
  });

  describe('listados', () => {
    it('recibidas filtra por la fundación dueña y del adoptante solo pide id, nombre y email', async () => {
      await service.listarRecibidas(FUNDACION, {
        ...PAGINA,
        estado: 'pendiente',
      });

      const [opciones] = solicitudes.findAndCount.mock.calls[0];
      expect(opciones.where).toEqual({
        mascota: { fundacionId: FUNDACION.sub },
        estado: 'pendiente',
      });
      expect(opciones.select).toMatchObject({
        adoptante: { id: true, nombre: true, email: true },
      });
      expect(JSON.stringify(opciones.select)).not.toContain('passwordHash');
    });

    it('mis_solicitudes filtra por el adoptante y pagina', async () => {
      const resultado = await service.listarMias(CIUDADANO, {
        pagina: 2,
        limite: 5,
      });

      expect(solicitudes.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { adoptanteId: CIUDADANO.sub },
          skip: 5,
          take: 5,
        }),
      );
      expect(resultado).toMatchObject({ pagina: 2, limite: 5 });
    });
  });
});
