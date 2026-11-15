import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CambiarEstadoUsuarioDto {
  @ApiProperty({ enum: ['activo', 'inactivo'] })
  @IsIn(['activo', 'inactivo'], { message: "El estado debe ser 'activo' o 'inactivo'" })
  estado: 'activo' | 'inactivo';
}
