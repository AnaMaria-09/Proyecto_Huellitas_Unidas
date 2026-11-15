import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MascotaEliminadaEvento } from '../../mascotas/eventos/mascota-eliminada.evento';
import { PROVEEDOR_ALMACENAMIENTO } from '../almacenamiento/tokens';
import { Archivo } from '../entities/archivo.entity';
import { AlmacenamientoFake } from '../testing/almacenamiento.fake';
import { MascotaEliminadaListener } from './mascota-eliminada.listener';

type RepositorioArchivosMock = {
  find: jest.Mock<Repository<Archivo>['find']>;
  delete: jest.Mock<(criterio: object) => Promise<unknown>>;
};

describe('MascotaEliminadaListener', () => {
  let almacenamiento: AlmacenamientoFake;
  let repositorio: RepositorioArchivosMock;
  let listener: MascotaEliminadaListener;

  beforeEach(async () => {
    almacenamiento = new AlmacenamientoFake();
    repositorio = {
      find: jest.fn<Repository<Archivo>['find']>().mockResolvedValue([]),
      delete: jest
        .fn<(criterio: object) => Promise<unknown>>()
        .mockResolvedValue({ affected: 0 }),
    };
    const modulo = await Test.createTestingModule({
      providers: [
        MascotaEliminadaListener,
        { provide: getRepositoryToken(Archivo), useValue: repositorio },
        { provide: PROVEEDOR_ALMACENAMIENTO, useValue: almacenamiento },
      ],
    }).compile();
    listener = modulo.get(MascotaEliminadaListener);
  });

  async function guardarImagenes(cantidad: number): Promise<string[]> {
    const claves: string[] = [];
    for (let i = 0; i < cantidad; i++) {
      claves.push(
        (await almacenamiento.guardar(Buffer.from(`imagen ${i}`), 'image/png'))
          .clave,
      );
    }
    repositorio.find.mockResolvedValue(
      claves.map((clave, i) =>
        Object.assign(new Archivo(), { id: i + 1, clave }),
      ),
    );
    return claves;
  }

  it('borra los archivos físicos y después las filas de la mascota', async () => {
    const claves = await guardarImagenes(2);

    await listener.alEliminarMascota(new MascotaEliminadaEvento(7));

    expect(repositorio.find).toHaveBeenCalledWith({
      where: { mascotaId: 7 },
      select: { id: true, clave: true },
    });
    for (const clave of claves) {
      expect(await almacenamiento.existe(clave)).toBe(false);
    }
    expect(repositorio.delete).toHaveBeenCalledWith({ mascotaId: 7 });
  });

  it('no borra filas si la mascota no tenía archivos', async () => {
    await listener.alEliminarMascota(new MascotaEliminadaEvento(7));

    expect(repositorio.delete).not.toHaveBeenCalled();
  });

  it('si falla un archivo físico lo registra y sigue con los demás', async () => {
    const [primera, segunda] = await guardarImagenes(2);
    const advertencia = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const eliminar = almacenamiento.eliminar.bind(almacenamiento);
    jest.spyOn(almacenamiento, 'eliminar').mockImplementation(async (clave) => {
      if (clave === primera) throw new Error('disco de solo lectura');
      await eliminar(clave);
    });

    await expect(
      listener.alEliminarMascota(new MascotaEliminadaEvento(7)),
    ).resolves.toBeUndefined();

    expect(advertencia).toHaveBeenCalledWith(expect.stringContaining(primera));
    expect(await almacenamiento.existe(segunda)).toBe(false);
    expect(repositorio.delete).toHaveBeenCalledWith({ mascotaId: 7 });
    advertencia.mockRestore();
  });

  it('un archivo que ya no está en disco no se registra como error', async () => {
    const [clave] = await guardarImagenes(1);
    await almacenamiento.eliminar(clave);
    const advertencia = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await listener.alEliminarMascota(new MascotaEliminadaEvento(7));

    expect(advertencia).not.toHaveBeenCalled();
    advertencia.mockRestore();
  });

  it('si falla la base de datos lo registra y no lanza', async () => {
    repositorio.find.mockRejectedValue(new Error('conexión perdida'));
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      listener.alEliminarMascota(new MascotaEliminadaEvento(7)),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('mascota 7'));
    error.mockRestore();
  });
});
