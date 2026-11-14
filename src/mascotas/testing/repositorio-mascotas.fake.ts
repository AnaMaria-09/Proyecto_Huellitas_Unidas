import { jest } from '@jest/globals';
import type { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Mascota } from '../entities/mascota.entity';

// Solo para pruebas unitarias: guarda las mascotas en memoria e implementa lo que usa MascotasService.
// findAndCount registra las opciones para comprobar los filtros; no los evalúa.
export class RepositorioMascotasFake {
  private readonly filas = new Map<number, Mascota>();
  private siguienteId = 1;

  create(datos: Partial<Mascota>): Mascota {
    return Object.assign(new Mascota(), datos);
  }

  async save(mascota: Mascota): Promise<Mascota> {
    mascota.id ??= this.siguienteId++;
    this.filas.set(mascota.id, Object.assign(new Mascota(), mascota));
    return mascota;
  }

  async findOneBy(where: FindOptionsWhere<Mascota>): Promise<Mascota | null> {
    return this.copia(where.id);
  }

  async findOne(opciones: FindOneOptions<Mascota>): Promise<Mascota | null> {
    const where = opciones.where as FindOptionsWhere<Mascota>;
    return this.copia(where.id);
  }

  async remove(mascota: Mascota): Promise<Mascota> {
    this.filas.delete(mascota.id);
    return mascota;
  }

  findAndCount = jest.fn(async (_opciones: FindManyOptions<Mascota>): Promise<[Mascota[], number]> => {
    const todas = [...this.filas.values()];
    return [todas, todas.length];
  });

  private copia(id: unknown): Mascota | null {
    const fila = typeof id === 'number' ? this.filas.get(id) : undefined;
    return fila ? Object.assign(new Mascota(), fila) : null;
  }
}
