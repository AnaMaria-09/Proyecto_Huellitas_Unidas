import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { Rol } from '../usuario.model';

export class CambiarRolDto {
  @ApiProperty({ enum: ['ciudadano', 'fundacion', 'administrador'] })
  @IsIn(['ciudadano', 'fundacion', 'administrador'])
  rol: Rol;
}
