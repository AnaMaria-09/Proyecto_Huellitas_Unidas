import type { Usuario } from '../usuarios/entities/usuario.entity';

export type Rol = 'ciudadano' | 'fundacion' | 'administrador';

export type EstadoUsuario = 'activo' | 'inactivo';

export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

export interface PayloadJwt {
  sub: number;
  rol: Rol;
  email: string;
}

// passwordHash tiene select: false, pero el usuario de buscarPorEmailConPassword sí lo trae.
export function sinPasswordHash(usuario: Usuario): UsuarioPublico {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...publico } = usuario;
  return publico;
}
