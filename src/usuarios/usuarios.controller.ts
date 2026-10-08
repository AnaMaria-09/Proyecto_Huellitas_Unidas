import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

@Controller('usuarios')
export class UsuariosController {
  // 1. GET /usuarios/perfil  (va ANTES de /usuarios/:id)
  @Get('perfil')
  obtenerMiPerfil() {
    return { mensaje: 'Perfil del usuario autenticado' };
  }

  // 2. PATCH /usuarios/perfil
  @Patch('perfil')
  actualizarMiPerfil(@Body() datos: any) {
    return { mensaje: 'Perfil actualizado', datos };
  }

  // 3. GET /usuarios
  @Get()
  obtenerTodosLosUsuarios() {
    return { mensaje: 'Lista de todos los usuarios' };
  }

  // 4. GET /usuarios/:id
  @Get(':id')
  obtenerUsuarioPorId(@Param('id') id: string) {
    return { mensaje: `Usuario con id ${id}` };
  }

  // 5. PATCH /usuarios/:id/estado
  @Patch(':id/estado')
  cambiarEstadoUsuario(@Param('id') id: string, @Body() datos: any) {
    return { mensaje: `Estado del usuario ${id} actualizado`, datos };
  }
}