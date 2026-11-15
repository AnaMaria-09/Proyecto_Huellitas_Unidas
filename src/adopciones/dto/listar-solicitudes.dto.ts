import { IntersectionType } from '@nestjs/swagger';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { FiltroSolicitudesDto } from './filtro-solicitudes.dto';

// Query params de los listados: ?estado=&pagina=&limite=
export class ListarSolicitudesDto extends IntersectionType(
  FiltroSolicitudesDto,
  PaginacionDto,
) {}
