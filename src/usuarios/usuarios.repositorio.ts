import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Rol } from '../autenticacion/usuario.model';
import type { OpcionesPagina } from '../common/paginacion';
import { Usuario } from './entities/usuario.entity';

export type DatosNuevoUsuario = Pick<Usuario, 'nombre' | 'email' | 'passwordHash' | 'rol'>;

@Injectable()
export class UsuariosRepositorio {
  constructor(@InjectRepository(Usuario) private readonly repositorio: Repository<Usuario>) {}

  async guardar(datos: DatosNuevoUsuario): Promise<Usuario> {
    const guardado = await this.repositorio.save(
      this.repositorio.create({ ...datos, email: datos.email.toLowerCase() }),
    );
    // Se vuelve a leer para devolver los valores por defecto de la base sin passwordHash.
    return this.repositorio.findOneByOrFail({ id: guardado.id });
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    return this.repositorio.findOneBy({ id });
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repositorio.findOneBy({ email: email.toLowerCase() });
  }

  // Única consulta que trae passwordHash, para verificar la contraseña.
  async buscarPorEmailConPassword(email: string): Promise<Usuario | null> {
    return this.repositorio
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .where('usuario.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async listar(pagina: OpcionesPagina): Promise<[Usuario[], number]> {
    return this.repositorio.findAndCount({ order: { id: 'ASC' }, ...pagina });
  }

  async listarFundacionesVerificadas(pagina: OpcionesPagina): Promise<[Usuario[], number]> {
    return this.repositorio.findAndCount({
      where: { rol: 'fundacion', verificada: true },
      order: { id: 'ASC' },
      ...pagina,
    });
  }

  async existeConRol(rol: Rol): Promise<boolean> {
    return this.repositorio.existsBy({ rol });
  }

  async actualizar(usuario: Usuario): Promise<Usuario> {
    return this.repositorio.save(usuario);
  }
}
