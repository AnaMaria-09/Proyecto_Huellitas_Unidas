import { FindOperator, type FindOneOptions, type FindOptionsWhere } from 'typeorm';
import type { Usuario } from '../../usuarios/entities/usuario.entity';
import { TokenRefresco } from '../entities/token-refresco.entity';

// Solo para pruebas unitarias: implementa en memoria lo que usa TokensService.
export class RepositorioTokensFake {
  readonly filas: TokenRefresco[] = [];
  private siguienteId = 1;

  constructor(private readonly usuarios: Map<number, Usuario>) {}

  create(datos: Partial<TokenRefresco>): TokenRefresco {
    return Object.assign(new TokenRefresco(), datos);
  }

  async save(token: TokenRefresco): Promise<TokenRefresco> {
    token.id ??= this.siguienteId++;
    token.creadoEn ??= new Date();
    this.filas.push(token);
    return token;
  }

  async findOne(opciones: FindOneOptions<TokenRefresco>): Promise<TokenRefresco | null> {
    const fila = this.filas.find((t) => coincide(t, opciones.where as FindOptionsWhere<TokenRefresco>));
    if (!fila) return null;
    return Object.assign(new TokenRefresco(), fila, { usuario: this.usuarios.get(fila.usuarioId) });
  }

  async update(
    criterio: FindOptionsWhere<TokenRefresco>,
    cambios: Partial<TokenRefresco>,
  ): Promise<{ affected: number }> {
    const afectadas = this.filas.filter((t) => coincide(t, criterio));
    afectadas.forEach((t) => Object.assign(t, cambios));
    return { affected: afectadas.length };
  }
}

// Igualdad por campo, más IsNull(), que es el único operador que usa TokensService.
function coincide(fila: TokenRefresco, criterio: FindOptionsWhere<TokenRefresco>): boolean {
  return Object.entries(criterio).every(([campo, esperado]) => {
    const valor = fila[campo as keyof TokenRefresco];
    if (esperado instanceof FindOperator) {
      return esperado.type === 'isNull' && (valor === null || valor === undefined);
    }
    return valor === esperado;
  });
}
