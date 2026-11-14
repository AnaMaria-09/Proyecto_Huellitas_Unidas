import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { EstadoMascota } from '../mascota.model';

export class CambiarEstadoDto {
  @ApiProperty({ enum: ['disponible', 'en_proceso', 'adoptada'] })
  @IsIn(['disponible', 'en_proceso', 'adoptada'])
  estado: EstadoMascota;
}
