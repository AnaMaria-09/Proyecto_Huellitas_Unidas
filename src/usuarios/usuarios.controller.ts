import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CambiarEstadoUsuarioDto } from './dto/cambiar-estado-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(AutenticadoGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // GET /usuarios/perfil (va ANTES de /usuarios/:id)
  @Get('perfil')
  obtenerMiPerfil(@UsuarioActual() usuario: PayloadJwt) {
    return this.usuariosService.obtenerPerfil(usuario.sub);
  }

  // PATCH /usuarios/perfil
  @Patch('perfil')
  actualizarMiPerfil(@UsuarioActual() usuario: PayloadJwt, @Body() datos: ActualizarPerfilDto) {
    return this.usuariosService.actualizarPerfil(usuario.sub, datos);
  }

  // GET /usuarios
  @Get()
  @Roles('administrador')
  listar() {
    return this.usuariosService.listar();
  }

  // GET /usuarios/:id (administrador o el mismo usuario)
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: PayloadJwt) {
    return this.usuariosService.obtenerPorId(id, usuario);
  }

  // PATCH /usuarios/:id/estado
  @Patch(':id/estado')
  @Roles('administrador')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() datos: CambiarEstadoUsuarioDto) {
    return this.usuariosService.cambiarEstado(id, datos.estado);
  }
}
