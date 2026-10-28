import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PayloadJwt, sinPasswordHash, Usuario, UsuarioPublico } from '../autenticacion/usuario.model';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ActualizarFundacionDto } from './dto/actualizar-fundacion.dto';

export type Fundacion = UsuarioPublico & { verificada: boolean };

@Injectable()
export class FundacionesService {
  constructor(private readonly usuariosRepositorio: UsuariosRepositorio) {}

  listarVerificadas(): Fundacion[] {
    return this.usuariosRepositorio
      .listar()
      .filter((u) => u.rol === 'fundacion' && u.verificada === true)
      .map(aFundacion);
  }

  // Las no verificadas solo las ven la propia fundación y los administradores;
  // para los demás responde 404 para no revelar que existen.
  obtenerPorId(id: number, solicitante?: PayloadJwt): Fundacion {
    const fundacion = this.buscarOFallar(id);
    const puedeVer =
      fundacion.verificada === true ||
      solicitante?.rol === 'administrador' ||
      solicitante?.sub === fundacion.id;
    if (!puedeVer) {
      throw new NotFoundException(`Fundación ${id} no encontrada`);
    }
    return aFundacion(fundacion);
  }

  actualizarMiFundacion(usuarioId: number, datos: ActualizarFundacionDto): Fundacion {
    const fundacion = this.buscarOFallar(usuarioId);
    // Se copian solo los campos de organización: 'verificada' nunca cambia aquí.
    const actualizada: Usuario = {
      ...fundacion,
      nombreOrganizacion: datos.nombreOrganizacion ?? fundacion.nombreOrganizacion,
      ciudad: datos.ciudad ?? fundacion.ciudad,
      telefono: datos.telefono ?? fundacion.telefono,
    };
    this.usuariosRepositorio.actualizar(actualizada);
    return aFundacion(actualizada);
  }

  cambiarVerificacion(id: number, verificada: boolean, solicitante: PayloadJwt): Fundacion {
    if (solicitante.rol !== 'administrador') {
      throw new ForbiddenException('Solo un administrador puede verificar fundaciones');
    }
    const actualizada: Usuario = { ...this.buscarOFallar(id), verificada };
    this.usuariosRepositorio.actualizar(actualizada);
    return aFundacion(actualizada);
  }

  private buscarOFallar(id: number): Usuario {
    const usuario = this.usuariosRepositorio.buscarPorId(id);
    if (!usuario || usuario.rol !== 'fundacion') {
      throw new NotFoundException(`Fundación ${id} no encontrada`);
    }
    return usuario;
  }
}

function aFundacion(usuario: Usuario): Fundacion {
  return { ...sinPasswordHash(usuario), verificada: usuario.verificada ?? false };
}
