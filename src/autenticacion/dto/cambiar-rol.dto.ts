import { IsIn } from 'class-validator';
import type { Rol } from '../usuario.model';

export class CambiarRolDto {
  @IsIn(['ciudadano', 'fundacion', 'administrador'])
  rol: Rol;
}
