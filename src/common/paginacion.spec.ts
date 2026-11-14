import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginacionDto } from './dto/paginacion.dto';
import { opcionesPagina, paginado } from './paginacion';

function dto(query: Record<string, string>): PaginacionDto {
  return plainToInstance(PaginacionDto, query);
}

describe('PaginacionDto', () => {
  it('usa pagina 1 y limite 20 por defecto', () => {
    expect(dto({})).toMatchObject({ pagina: 1, limite: 20 });
  });

  it('convierte los query params a número', () => {
    const paginacion = dto({ pagina: '3', limite: '50' });
    expect(validateSync(paginacion)).toHaveLength(0);
    expect(paginacion).toMatchObject({ pagina: 3, limite: 50 });
  });

  it('rechaza pagina menor que 1 y limite mayor que 100', () => {
    const errores = validateSync(dto({ pagina: '0', limite: '101' }));
    expect(errores.map((e) => e.property).sort()).toEqual(['limite', 'pagina']);
  });
});

describe('paginación', () => {
  it('calcula skip y take', () => {
    expect(opcionesPagina({ pagina: 3, limite: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('arma la respuesta { datos, total, pagina, limite }', () => {
    expect(paginado([['a', 'b'], 12], { pagina: 2, limite: 2 })).toEqual({
      datos: ['a', 'b'],
      total: 12,
      pagina: 2,
      limite: 2,
    });
  });
});
