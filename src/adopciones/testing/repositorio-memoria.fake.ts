import { jest } from '@jest/globals';
import type {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
} from 'typeorm';

type Where<T> = FindOptionsWhere<T> | FindOptionsWhere<T>[];

// Solo para pruebas unitarias: repositorio en memoria con lo que usan los servicios de adopciones.
// where se evalúa por igualdad de campos simples; un arreglo de where es un OR. lock y select se ignoran.
// findAndCount registra las opciones para comprobar los filtros; no los evalúa.
export class RepositorioMemoria<T extends { id: number }> {
  private readonly filas = new Map<number, T>();
  private siguienteId = 1;

  constructor(
    private readonly crearInstancia: () => T,
    // Completa las relaciones cuando la consulta pide relations.
    private readonly cargarRelaciones: (fila: T) => Promise<T> = (fila) =>
      Promise.resolve(fila),
  ) {}

  create(datos: Partial<T>): T {
    return Object.assign(this.crearInstancia(), datos);
  }

  async save(fila: T): Promise<T> {
    fila.id ??= this.siguienteId++;
    this.filas.set(fila.id, this.copia(fila));
    return fila;
  }

  async findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.findOne({ where });
  }

  async findOne(opciones: FindOneOptions<T>): Promise<T | null> {
    const [primera] = await this.find(opciones);
    return primera ?? null;
  }

  async find(opciones: FindManyOptions<T> = {}): Promise<T[]> {
    const coincidencias = [...this.filas.values()]
      .filter((fila) => coincide(fila, opciones.where))
      .map((fila) => this.copia(fila));
    return opciones.relations
      ? Promise.all(coincidencias.map((fila) => this.cargarRelaciones(fila)))
      : coincidencias;
  }

  findAndCount = jest.fn(
    async (_opciones: FindManyOptions<T>): Promise<[T[], number]> => {
      const todas = [...this.filas.values()];
      return [todas, todas.length];
    },
  );

  todas(): T[] {
    return [...this.filas.values()].map((fila) => this.copia(fila));
  }

  private copia(fila: T): T {
    return Object.assign(this.crearInstancia(), fila);
  }
}

function coincide<T>(fila: T, where?: Where<T>): boolean {
  if (!where) return true;
  if (Array.isArray(where))
    return where.some((opcion) => coincide(fila, opcion));
  return Object.entries(where).every(
    ([campo, valor]) => fila[campo as keyof T] === valor,
  );
}
