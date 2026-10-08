import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

@Controller('autenticacion')
export class AutenticacionController {
  // 1. POST /autenticacion/registro
  @Post('registro')
  registrarUsuario(@Body() datos: any) {
    return { mensaje: 'Usuario registrado', datos };
  }

  // 2. POST /autenticacion/iniciar_sesion
  @Post('iniciar_sesion')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() credenciales: any) {
    return { mensaje: 'Sesión iniciada', credenciales };
  }

  // 3. POST /autenticacion/refrescar_token
  @Post('refrescar_token')
  @HttpCode(HttpStatus.OK)
  refrescarToken(@Body() datos: any) {
    return { mensaje: 'Token refrescado', datos };
  }

  // 4. POST /autenticacion/cerrar_sesion
  @Post('cerrar_sesion')
  @HttpCode(HttpStatus.OK)
  cerrarSesion(@Body() datos: any) {
    return { mensaje: 'Sesión cerrada', datos };
  }

  // 5. PATCH /autenticacion/cambiar_contrasena
  @Patch('cambiar_contrasena')
  cambiarContrasena(@Body() datos: any) {
    return { mensaje: 'Contraseña actualizada', datos };
  }

  // 6. PATCH /autenticacion/usuarios/:id/rol
  @Patch('usuarios/:id/rol')
  cambiarRolUsuario(@Param('id') id: string, @Body() datos: any) {
    return { mensaje: `Rol del usuario ${id} actualizado`, datos };
  }
}