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
  // Datos de organización, solo para usuarios con rol 'fundacion'.
  nombreOrganizacion?: string;
  ciudad?: string;
  telefono?: string;
  verificada?: boolean;
}

export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

export interface PayloadJwt {
  sub: number;
  rol: Rol;
  email: string;
}

export function sinPasswordHash(usuario: Usuario): UsuarioPublico {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...publico } = usuario;
  return publico;
}
