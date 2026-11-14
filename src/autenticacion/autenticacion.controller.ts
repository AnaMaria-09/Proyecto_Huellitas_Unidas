import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AutenticacionService } from './autenticacion.service';
import { Roles } from './decoradores/roles.decorator';
import { UsuarioActual } from './decoradores/usuario-actual.decorator';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { CerrarSesionDto } from './dto/cerrar-sesion.dto';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RefrescarTokenDto } from './dto/refrescar-token.dto';
import { RegistroDto } from './dto/registro.dto';
import { AutenticadoGuard } from './guards/autenticado.guard';
import { RolesGuard } from './guards/roles.guard';
import type { PayloadJwt } from './usuario.model';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(
    private readonly autenticacionService: AutenticacionService,
    private readonly usuariosService: UsuariosService,
  ) {}

  // POST /autenticacion/registro
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() datos: RegistroDto) {
    return this.autenticacionService.registrar(datos);
  }

  // POST /autenticacion/iniciar_sesion → { accessToken, refreshToken }
  @Post('iniciar_sesion')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() datos: IniciarSesionDto) {
    return this.autenticacionService.iniciarSesion(datos);
  }

  // POST /autenticacion/refrescar_token: rota el refresh token y devuelve un par nuevo.
  @Post('refrescar_token')
  @HttpCode(HttpStatus.OK)
  refrescarToken(@Body() datos: RefrescarTokenDto) {
    return this.autenticacionService.refrescarToken(datos);
  }

  // POST /autenticacion/cerrar_sesion: revoca el refresh token de esta sesión.
  @Post('cerrar_sesion')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AutenticadoGuard)
  async cerrarSesion(@UsuarioActual() usuario: PayloadJwt, @Body() datos: CerrarSesionDto): Promise<void> {
    await this.autenticacionService.cerrarSesion(usuario.sub, datos);
  }

  // PATCH /autenticacion/cambiar_contrasena: también cierra todas las sesiones (revoca los refresh tokens).
  @Patch('cambiar_contrasena')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AutenticadoGuard)
  async cambiarContrasena(@UsuarioActual() usuario: PayloadJwt, @Body() datos: CambiarContrasenaDto): Promise<void> {
    await this.autenticacionService.cambiarContrasena(usuario.sub, datos);
  }

  // PATCH /autenticacion/usuarios/:id/rol (solo administrador)
  @Patch('usuarios/:id/rol')
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('administrador')
  cambiarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CambiarRolDto,
    @UsuarioActual() usuario: PayloadJwt,
  ) {
    return this.usuariosService.cambiarRol(id, datos.rol, usuario);
  }
}
