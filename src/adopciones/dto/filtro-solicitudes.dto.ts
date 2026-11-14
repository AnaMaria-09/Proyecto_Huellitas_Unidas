import { IsIn, IsOptional } from 'class-validator';
import { ESTADOS_SOLICITUD } from '../adopcion.model';
import type { EstadoSolicitud } from '../adopcion.model';

export class FiltroSolicitudesDto {
  @IsOptional()
  @IsIn(ESTADOS_SOLICITUD, { message: `El estado debe ser uno de: ${ESTADOS_SOLICITUD.join(', ')}` })
  estado?: EstadoSolicitud;
}
