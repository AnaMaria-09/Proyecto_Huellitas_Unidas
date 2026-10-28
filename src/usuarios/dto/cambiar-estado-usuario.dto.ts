import { IsIn } from 'class-validator';

export class CambiarEstadoUsuarioDto {
  @IsIn(['activo', 'inactivo'])
  estado: 'activo' | 'inactivo';
}
