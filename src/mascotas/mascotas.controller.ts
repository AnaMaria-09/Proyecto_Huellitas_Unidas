import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { PaginacionDto } from '../common/dto/paginacion.dto';
import { ActualizarMascotaDto } from './dto/actualizar-mascota.dto';
import { BuscarMascotasDto } from './dto/buscar-mascotas.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { MascotasService } from './mascotas.service';

// La fundación se identifica por el 'sub' del JWT.
@ApiTags('mascotas')
@Controller('mascotas')
export class MascotasController {
  constructor(private readonly mascotasService: MascotasService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  crear(@UsuarioActual() usuario: PayloadJwt, @Body() datos: CreateMascotaDto) {
    return this.mascotasService.crear(usuario.sub, datos);
  }

  @Get()
  obtenerDisponibles(@Query() paginacion: PaginacionDto) {
    return this.mascotasService.obtenerDisponibles(paginacion);
  }

  // Debe declararse antes de GET /:id para que "buscar" no se interprete como un id.
  @Get('buscar')
  buscar(@Query() filtros: BuscarMascotasDto) {
    return this.mascotasService.buscar(filtros);
  }

  // GET /mascotas/mis_mascotas: también antes de GET /:id.
  @Get('mis_mascotas')
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  obtenerMisMascotas(@UsuarioActual() usuario: PayloadJwt, @Query() paginacion: PaginacionDto) {
    return this.mascotasService.obtenerDeFundacion(usuario.sub, paginacion);
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.mascotasService.obtenerPorId(id);
  }

  @Patch(':id/estado')
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
    @Body() datos: CambiarEstadoDto,
  ) {
    return this.mascotasService.cambiarEstado(id, usuario.sub, datos.estado);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
    @Body() datos: ActualizarMascotaDto,
  ) {
    return this.mascotasService.actualizar(id, usuario.sub, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  async eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: PayloadJwt): Promise<void> {
    await this.mascotasService.eliminar(id, usuario.sub);
  }
}
