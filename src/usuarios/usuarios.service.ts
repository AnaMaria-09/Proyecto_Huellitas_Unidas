import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  EstadoUsuario,
  PayloadJwt,
  sinPasswordHash,
  Usuario,
  UsuarioPublico,
} from '../autenticacion/usuario.model';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { UsuariosRepositorio } from './usuarios.repositorio';

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepositorio: UsuariosRepositorio) {}

  obtenerPerfil(usuarioId: number): UsuarioPublico {
    return sinPasswordHash(this.buscarOFallar(usuarioId));
  }

  actualizarPerfil(usuarioId: number, datos: ActualizarPerfilDto): UsuarioPublico {
    const usuario = this.buscarOFallar(usuarioId);
    const email = datos.email?.toLowerCase();
    if (email && email !== usuario.email) {
      const existente = this.usuariosRepositorio.buscarPorEmail(email);
      if (existente && existente.id !== usuario.id) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    const actualizado: Usuario = {
      ...usuario,
      nombre: datos.nombre ?? usuario.nombre,
      email: email ?? usuario.email,
    };
    this.usuariosRepositorio.actualizar(actualizado);
    return sinPasswordHash(actualizado);
  }

  listar(): UsuarioPublico[] {
    return this.usuariosRepositorio.listar().map(sinPasswordHash);
  }

  obtenerPorId(id: number, solicitante: PayloadJwt): UsuarioPublico {
    if (solicitante.rol !== 'administrador' && solicitante.sub !== id) {
      throw new ForbiddenException('No tienes permisos para ver este usuario');
    }
    return sinPasswordHash(this.buscarOFallar(id));
  }

  cambiarEstado(id: number, estado: EstadoUsuario): UsuarioPublico {
    const actualizado: Usuario = { ...this.buscarOFallar(id), estado };
    this.usuariosRepositorio.actualizar(actualizado);
    return sinPasswordHash(actualizado);
  }

  private buscarOFallar(id: number): Usuario {
    const usuario = this.usuariosRepositorio.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }
}
