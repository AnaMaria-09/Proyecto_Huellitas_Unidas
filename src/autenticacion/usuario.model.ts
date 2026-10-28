export type Rol = 'ciudadano' | 'fundacion' | 'administrador';

export type EstadoUsuario = 'activo' | 'inactivo';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  estado: EstadoUsuario;
  creadoEn: Date;
}

export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

export interface PayloadJwt {
  sub: number;
  rol: Rol;
  email: string;
}
