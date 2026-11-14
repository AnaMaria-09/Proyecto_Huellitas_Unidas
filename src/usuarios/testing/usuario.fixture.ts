import { jest } from '@jest/globals';
import type { Mocked } from 'jest-mock';
import { Usuario } from '../entities/usuario.entity';
import type { PayloadJwt } from '../../autenticacion/usuario.model';
import type { UsuariosRepositorio } from '../usuarios.repositorio';

// Solo para pruebas unitarias.
export function crearUsuario(cambios: Partial<Usuario> = {}): Usuario {
  return Object.assign(new Usuario(), {
    id: 1,
    nombre: 'Prueba',
    email: 'prueba@test.com',
    rol: 'ciudadano',
    estado: 'activo',
    nombreOrganizacion: null,
    ciudad: null,
    telefono: null,
    verificada: false,
    creadoEn: new Date('2026-01-01T00:00:00Z'),
    actualizadoEn: new Date('2026-01-01T00:00:00Z'),
    ...cambios,
  });
}

export function tokenDe(usuario: Usuario): PayloadJwt {
  return { sub: usuario.id, rol: usuario.rol, email: usuario.email };
}

export type UsuariosRepositorioMock = Mocked<
  Pick<
    UsuariosRepositorio,
    | 'guardar'
    | 'buscarPorId'
    | 'buscarPorEmail'
    | 'buscarPorEmailConPassword'
    | 'listar'
    | 'listarFundacionesVerificadas'
    | 'existeConRol'
    | 'actualizar'
  >
>;

// actualizar devuelve lo que recibe, como save() de TypeORM.
export function crearUsuariosRepositorioMock(): UsuariosRepositorioMock {
  return {
    guardar: jest.fn<UsuariosRepositorio['guardar']>(),
    buscarPorId: jest.fn<UsuariosRepositorio['buscarPorId']>().mockResolvedValue(null),
    buscarPorEmail: jest.fn<UsuariosRepositorio['buscarPorEmail']>().mockResolvedValue(null),
    buscarPorEmailConPassword: jest.fn<UsuariosRepositorio['buscarPorEmailConPassword']>().mockResolvedValue(null),
    listar: jest.fn<UsuariosRepositorio['listar']>().mockResolvedValue([[], 0]),
    listarFundacionesVerificadas: jest
      .fn<UsuariosRepositorio['listarFundacionesVerificadas']>()
      .mockResolvedValue([[], 0]),
    existeConRol: jest.fn<UsuariosRepositorio['existeConRol']>().mockResolvedValue(false),
    actualizar: jest.fn<UsuariosRepositorio['actualizar']>((usuario) => Promise.resolve(usuario)),
  };
}
