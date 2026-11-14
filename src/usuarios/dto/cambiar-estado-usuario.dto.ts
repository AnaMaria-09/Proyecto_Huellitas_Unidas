import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CambiarEstadoUsuarioDto {
  @ApiProperty({ enum: ['activo', 'inactivo'] })
  @IsIn(['activo', 'inactivo'])
  estado: 'activo' | 'inactivo';
}
