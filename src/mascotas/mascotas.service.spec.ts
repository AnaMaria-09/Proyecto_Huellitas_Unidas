import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, EntityManager, ILike, MoreThanOrEqual } from 'typeorm';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { Mascota } from './entities/mascota.entity';
import { MascotasService } from './mascotas.service';
import { crearUsuario, crearUsuariosRepositorioMock, UsuariosRepositorioMock } from '../usuarios/testing/usuario.fixture';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { RepositorioMascotasFake } from './testing/repositorio-mascotas.fake';

const FUNDACION_ID = 1;
const PAGINA = { pagina: 1, limite: 20 };

function datosMascota(cambios: Partial<CreateMascotaDto> = {}): CreateMascotaDto {
  return {
    nombre: 'Firulais',
    especie: 'perro',
    tamano: 'mediano',
    edadMeses: 24,
    sexo: 'macho',
    ciudad: 'Bogotá',
    ...cambios,
  };
}

describe('MascotasService', () => {
  let repositorio: RepositorioMascotasFake;
  let usuarios: UsuariosRepositorioMock;
  let service: MascotasService;

  beforeEach(async () => {
    repositorio = new RepositorioMascotasFake();
    usuarios = crearUsuariosRepositorioMock();
    usuarios.buscarPorId.mockResolvedValue(crearUsuario({ id: FUNDACION_ID, rol: 'fundacion', verificada: true }));
    const modulo = await Test.createTestingModule({
      providers: [
        MascotasService,
        { provide: getRepositoryToken(Mascota), useValue: repositorio },
        { provide: UsuariosRepositorio, useValue: usuarios },
      ],
    }).compile();
    service = modulo.get(MascotasService);
  });

  describe('crear', () => {
    it('guarda la mascota como disponible y de la fundación indicada', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      expect(mascota).toMatchObject({ id: 1, fundacionId: FUNDACION_ID, estado: 'disponible' });
    });

    it('lanza Forbidden si la fundación no está verificada', async () => {
      usuarios.buscarPorId.mockResolvedValue(crearUsuario({ id: FUNDACION_ID, rol: 'fundacion', verificada: false }));

      await expect(service.crear(FUNDACION_ID, datosMascota())).rejects.toThrow(/no está verificada/);
      await expect(service.crear(FUNDACION_ID, datosMascota())).rejects.toThrow(ForbiddenException);
      // No se guardó nada.
      await expect(service.obtenerPorId(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cambiarEstado', () => {
    it('permite disponible → en_proceso', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.cambiarEstado(mascota.id, FUNDACION_ID, 'en_proceso')).resolves.toMatchObject({ estado: 'en_proceso' });
    });

    it('permite en_proceso → disponible (cancelar solicitud)', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await service.cambiarEstado(mascota.id, FUNDACION_ID, 'en_proceso');
      await expect(service.cambiarEstado(mascota.id, FUNDACION_ID, 'disponible')).resolves.toMatchObject({ estado: 'disponible' });
    });

    it('permite en_proceso → adoptada', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await service.cambiarEstado(mascota.id, FUNDACION_ID, 'en_proceso');
      await expect(service.cambiarEstado(mascota.id, FUNDACION_ID, 'adoptada')).resolves.toMatchObject({ estado: 'adoptada' });
    });

    it('rechaza disponible → adoptada', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.cambiarEstado(mascota.id, FUNDACION_ID, 'adoptada')).rejects.toThrow(ConflictException);
    });

    it('lanza Forbidden si otra fundación cambia el estado', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.cambiarEstado(mascota.id, 99, 'en_proceso')).rejects.toThrow(ForbiddenException);
      await expect(service.obtenerPorId(mascota.id)).resolves.toMatchObject({ estado: 'disponible' });
    });

    it('rechaza cualquier cambio desde adoptada, indicando estado actual y solicitado', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await service.cambiarEstado(mascota.id, FUNDACION_ID, 'en_proceso');
      await service.cambiarEstado(mascota.id, FUNDACION_ID, 'adoptada');

      await expect(service.cambiarEstado(mascota.id, FUNDACION_ID, 'disponible')).rejects.toThrow(/'adoptada' a 'disponible'/);
      await expect(service.cambiarEstado(mascota.id, FUNDACION_ID, 'en_proceso')).rejects.toThrow(ConflictException);
    });
  });

  describe('cambiarEstadoPorSistema', () => {
    it('aplica una transición válida sin validar dueño', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.cambiarEstadoPorSistema(mascota.id, 'en_proceso')).resolves.toMatchObject({ estado: 'en_proceso' });
    });

    it('rechaza una transición inválida con ConflictException', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.cambiarEstadoPorSistema(mascota.id, 'adoptada')).rejects.toThrow(ConflictException);
    });

    it('lanza 404 si la mascota no existe', async () => {
      await expect(service.cambiarEstadoPorSistema(999, 'en_proceso')).rejects.toThrow(NotFoundException);
    });

    it('con manager usa su repositorio y bloquea la fila', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      const findOne = jest.spyOn(repositorio, 'findOne');
      const manager = { getRepository: jest.fn(() => repositorio) } as unknown as EntityManager;

      await service.cambiarEstadoPorSistema(mascota.id, 'en_proceso', manager);

      expect(manager.getRepository).toHaveBeenCalledWith(Mascota);
      expect(findOne).toHaveBeenCalledWith({ where: { id: mascota.id }, lock: { mode: 'pessimistic_write' } });
    });
  });

  describe('buscar', () => {
    it('sin filtros consulta solo las disponibles, paginado', async () => {
      await service.buscar({ ...PAGINA, pagina: 2 });
      expect(repositorio.findAndCount).toHaveBeenCalledWith({
        where: { estado: 'disponible' },
        order: { id: 'ASC' },
        skip: 20,
        take: 20,
      });
    });

    it('arma los filtros en la consulta: ciudad con ILIKE escapado y rango de edad', async () => {
      await service.buscar({ ...PAGINA, especie: 'gato', sexo: 'hembra', ciudad: ' bo%gotá ', edadMinMeses: 10, edadMaxMeses: 30 });
      expect(repositorio.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            estado: 'disponible',
            especie: 'gato',
            sexo: 'hembra',
            ciudad: ILike('bo\\%gotá'),
            edadMeses: Between(10, 30),
          },
        }),
      );
    });

    it('con solo edad mínima usa MoreThanOrEqual', async () => {
      await service.buscar({ ...PAGINA, edadMinMeses: 6 });
      expect(repositorio.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { estado: 'disponible', edadMeses: MoreThanOrEqual(6) } }),
      );
    });

    it('lanza BadRequest si edadMinMeses > edadMaxMeses', async () => {
      await expect(service.buscar({ ...PAGINA, edadMinMeses: 30, edadMaxMeses: 10 })).rejects.toThrow(BadRequestException);
    });

    it('devuelve { datos, total, pagina, limite }', async () => {
      await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.buscar(PAGINA)).resolves.toMatchObject({ total: 1, pagina: 1, limite: 20 });
    });
  });

  describe('actualizar', () => {
    it('lanza Forbidden si la fundación no es la dueña', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await expect(service.actualizar(mascota.id, 99, { nombre: 'Otro' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('eliminar', () => {
    it('elimina una mascota disponible', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await service.eliminar(mascota.id, FUNDACION_ID);
      await expect(service.obtenerPorId(mascota.id)).rejects.toThrow(NotFoundException);
    });

    it('lanza Conflict si la mascota está en proceso', async () => {
      const mascota = await service.crear(FUNDACION_ID, datosMascota());
      await service.cambiarEstado(mascota.id, FUNDACION_ID, 'en_proceso');
      await expect(service.eliminar(mascota.id, FUNDACION_ID)).rejects.toThrow(ConflictException);
    });
  });
});
