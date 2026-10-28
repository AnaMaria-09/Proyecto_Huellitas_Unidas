import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AutenticacionOpcionalGuard } from '../autenticacion/guards/autenticacion-opcional.guard';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { ActualizarFundacionDto } from './dto/actualizar-fundacion.dto';
import { CambiarVerificacionDto } from './dto/cambiar-verificacion.dto';
import { FundacionesService } from './fundaciones.service';

@Controller('fundaciones')
export class FundacionesController {
  constructor(private readonly fundacionesService: FundacionesService) {}

  // GET /fundaciones (público, solo verificadas)
  @Get()
  listarVerificadas() {
    return this.fundacionesService.listarVerificadas();
  }

  // PATCH /fundaciones/mi_fundacion (va ANTES de /fundaciones/:id)
  @Patch('mi_fundacion')
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  actualizarMiFundacion(@UsuarioActual() usuario: PayloadJwt, @Body() datos: ActualizarFundacionDto) {
    return this.fundacionesService.actualizarMiFundacion(usuario.sub, datos);
  }

  // GET /fundaciones/:id (público si está verificada; si no, solo la propia fundación o un administrador)
  @Get(':id')
  @UseGuards(AutenticacionOpcionalGuard)
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario?: PayloadJwt) {
    return this.fundacionesService.obtenerPorId(id, usuario);
  }

  // PATCH /fundaciones/:id/verificacion
  @Patch(':id/verificacion')
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('administrador')
  cambiarVerificacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CambiarVerificacionDto,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.fundacionesService.cambiarVerificacion(id, datos.verificada, usuario);
  }
}
