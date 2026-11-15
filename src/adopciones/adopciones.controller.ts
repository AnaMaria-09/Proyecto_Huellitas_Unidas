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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { AdopcionesService } from './adopciones.service';
import { ConfirmarEntregaDto } from './dto/confirmar-entrega.dto';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { EvaluarSolicitudDto } from './dto/evaluar-solicitud.dto';
import { ListarSolicitudesDto } from './dto/listar-solicitudes.dto';

// Todas las rutas requieren sesión; los permisos sobre cada solicitud los valida el servicio.
@ApiTags('adopciones')
@ApiBearerAuth()
@UseGuards(AutenticadoGuard, RolesGuard)
@Controller('adopciones')
export class AdopcionesController {
  constructor(private readonly adopcionesService: AdopcionesService) {}

  @Post()
  @Roles('ciudadano')
  crear(
    @UsuarioActual() usuario: PayloadJwt,
    @Body() datos: CrearSolicitudDto,
  ) {
    return this.adopcionesService.crear(usuario, datos);
  }

  // mis_solicitudes y recibidas deben declararse antes de GET /:id.
  @Get('mis_solicitudes')
  @Roles('ciudadano')
  listarMias(
    @UsuarioActual() usuario: PayloadJwt,
    @Query() filtros: ListarSolicitudesDto,
  ) {
    return this.adopcionesService.listarMias(usuario, filtros);
  }

  @Get('recibidas')
  @Roles('fundacion')
  listarRecibidas(
    @UsuarioActual() usuario: PayloadJwt,
    @Query() filtros: ListarSolicitudesDto,
  ) {
    return this.adopcionesService.listarRecibidas(usuario, filtros);
  }

  @Get(':id')
  obtener(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.adopcionesService.obtener(id, usuario);
  }

  @Get(':id/historial')
  listarHistorial(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.adopcionesService.listarHistorial(id, usuario);
  }

  @Patch(':id/evaluacion')
  @Roles('fundacion')
  evaluar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
    @Body() datos: EvaluarSolicitudDto,
  ) {
    return this.adopcionesService.evaluar(id, usuario, datos);
  }

  @Patch(':id/confirmar_entrega')
  @Roles('fundacion')
  confirmarEntrega(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
    @Body() datos: ConfirmarEntregaDto,
  ) {
    return this.adopcionesService.confirmarEntrega(id, usuario, datos);
  }

  // Cancela la solicitud; no la borra.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ciudadano')
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: PayloadJwt,
  ): Promise<void> {
    await this.adopcionesService.cancelar(id, usuario);
  }
}
