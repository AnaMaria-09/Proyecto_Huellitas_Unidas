import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PayloadJwt, sinPasswordHash, UsuarioPublico } from '../autenticacion/usuario.model';
import { PaginacionDto } from '../common/dto/paginacion.dto';
import { opcionesPagina, Paginado, paginado } from '../common/paginacion';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ActualizarFundacionDto } from './dto/actualizar-fundacion.dto';

export type Fundacion = UsuarioPublico;

@Injectable()
export class FundacionesService {
  constructor(private readonly usuariosRepositorio: UsuariosRepositorio) {}

  async listarVerificadas(paginacion: PaginacionDto): Promise<Paginado<Fundacion>> {
    const [fundaciones, total] = await this.usuariosRepositorio.listarFundacionesVerificadas(
      opcionesPagina(paginacion),
    );
    return paginado([fundaciones.map(sinPasswordHash), total], paginacion);
  }

  // Las no verificadas solo las ven la propia fundación y los administradores;
  // para los demás responde 404 para no revelar que existen.
  async obtenerPorId(id: number, solicitante?: PayloadJwt): Promise<Fundacion> {
    const fundacion = await this.buscarOFallar(id);
    const puedeVer =
      fundacion.verificada || solicitante?.rol === 'administrador' || solicitante?.sub === fundacion.id;
    if (!puedeVer) {
      throw new NotFoundException(`Fundación ${id} no encontrada`);
    }
    return sinPasswordHash(fundacion);
  }

  async actualizarMiFundacion(usuarioId: number, datos: ActualizarFundacionDto): Promise<Fundacion> {
    const fundacion = await this.buscarOFallar(usuarioId);
    // Se copian solo los campos de organización: 'verificada' nunca cambia aquí.
    fundacion.nombreOrganizacion = datos.nombreOrganizacion ?? fundacion.nombreOrganizacion;
    fundacion.ciudad = datos.ciudad ?? fundacion.ciudad;
    fundacion.telefono = datos.telefono ?? fundacion.telefono;
    return sinPasswordHash(await this.usuariosRepositorio.actualizar(fundacion));
  }

  async cambiarVerificacion(id: number, verificada: boolean, solicitante: PayloadJwt): Promise<Fundacion> {
    if (solicitante.rol !== 'administrador') {
      throw new ForbiddenException('Solo un administrador puede verificar fundaciones');
    }
    const fundacion = await this.buscarOFallar(id);
    fundacion.verificada = verificada;
    return sinPasswordHash(await this.usuariosRepositorio.actualizar(fundacion));
  }

  private async buscarOFallar(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepositorio.buscarPorId(id);
    if (!usuario || usuario.rol !== 'fundacion') {
      throw new NotFoundException(`Fundación ${id} no encontrada`);
    }
    return usuario;
  }
}
