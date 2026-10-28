import { IsIn } from 'class-validator';
import type { EstadoMascota } from '../mascota.model';

export class CambiarEstadoDto {
  @IsIn(['disponible', 'en_proceso', 'adoptada'])
  estado: EstadoMascota;
}
