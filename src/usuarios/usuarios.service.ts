import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  EstadoUsuario,
  PayloadJwt,
  Rol,
  sinPasswordHash,
  UsuarioPublico,
} from '../autenticacion/usuario.model';
import { PaginacionDto } from '../common/dto/paginacion.dto';
import { opcionesPagina, Paginado, paginado } from '../common/paginacion';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { Usuario } from './entities/usuario.entity';
import { UsuariosRepositorio } from './usuarios.repositorio';

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepositorio: UsuariosRepositorio) {}

  async obtenerPerfil(usuarioId: number): Promise<UsuarioPublico> {
    return sinPasswordHash(await this.buscarOFallar(usuarioId));
  }

  async actualizarPerfil(usuarioId: number, datos: ActualizarPerfilDto): Promise<UsuarioPublico> {
    const usuario = await this.buscarOFallar(usuarioId);
    const email = datos.email?.toLowerCase();
    if (email && email !== usuario.email) {
      const existente = await this.usuariosRepositorio.buscarPorEmail(email);
      if (existente && existente.id !== usuario.id) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    usuario.nombre = datos.nombre ?? usuario.nombre;
    usuario.email = email ?? usuario.email;
    return sinPasswordHash(await this.usuariosRepositorio.actualizar(usuario));
  }

  async listar(paginacion: PaginacionDto): Promise<Paginado<UsuarioPublico>> {
    const [usuarios, total] = await this.usuariosRepositorio.listar(opcionesPagina(paginacion));
    return paginado([usuarios.map(sinPasswordHash), total], paginacion);
  }

  async obtenerPorId(id: number, solicitante: PayloadJwt): Promise<UsuarioPublico> {
    if (solicitante.rol !== 'administrador' && solicitante.sub !== id) {
      throw new ForbiddenException('No tienes permisos para ver este usuario');
    }
    return sinPasswordHash(await this.buscarOFallar(id));
  }

  async cambiarEstado(id: number, estado: EstadoUsuario): Promise<UsuarioPublico> {
    const usuario = await this.buscarOFallar(id);
    usuario.estado = estado;
    return sinPasswordHash(await this.usuariosRepositorio.actualizar(usuario));
  }

  // Un administrador no puede quitarse su propio rol, para que siempre quede al menos uno.
  async cambiarRol(id: number, rol: Rol, solicitante: PayloadJwt): Promise<UsuarioPublico> {
    if (solicitante.sub === id && rol !== 'administrador') {
      throw new ConflictException('Un administrador no puede quitarse su propio rol de administrador');
    }
    const usuario = await this.buscarOFallar(id);
    usuario.rol = rol;
    return sinPasswordHash(await this.usuariosRepositorio.actualizar(usuario));
  }

  private async buscarOFallar(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepositorio.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return usuario;
  }
}
