import type { PaginacionDto } from './dto/paginacion.dto';

export interface Paginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
}

// Opciones skip/take de TypeORM para una página.
export interface OpcionesPagina {
  skip: number;
  take: number;
}

export function opcionesPagina({ pagina, limite }: PaginacionDto): OpcionesPagina {
  return { skip: (pagina - 1) * limite, take: limite };
}

export function paginado<T>([datos, total]: [T[], number], { pagina, limite }: PaginacionDto): Paginado<T> {
  return { datos, total, pagina, limite };
}
