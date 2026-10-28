import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PayloadJwt, Rol, Usuario } from '../autenticacion/usuario.model';
import { UsuariosRepositorio } from './usuarios.repositorio';
import { UsuariosService } from './usuarios.service';

function crearUsuario(repositorio: UsuariosRepositorio, email: string, rol: Rol = 'ciudadano'): Usuario {
  return repositorio.guardar({
    nombre: 'Prueba',
    email,
    passwordHash: 'hash',
    rol,
    estado: 'activo',
    creadoEn: new Date(),
  });
}

function token(usuario: Usuario): PayloadJwt {
  return { sub: usuario.id, rol: usuario.rol, email: usuario.email };
}

describe('UsuariosService', () => {
  let repositorio: UsuariosRepositorio;
  let service: UsuariosService;

  beforeEach(() => {
    repositorio = new UsuariosRepositorio();
    service = new UsuariosService(repositorio);
  });

  describe('actualizarPerfil', () => {
    it('rechaza un email que ya usa otro usuario', () => {
      const ana = crearUsuario(repositorio, 'ana@test.com');
      crearUsuario(repositorio, 'luis@test.com');

      expect(() => service.actualizarPerfil(ana.id, { email: 'Luis@test.com' })).toThrow(ConflictException);
    });

    it('permite conservar su propio email y cambiar el nombre', () => {
      const ana = crearUsuario(repositorio, 'ana@test.com');

      const perfil = service.actualizarPerfil(ana.id, { nombre: 'Ana María', email: 'ana@test.com' });

      expect(perfil).toMatchObject({ nombre: 'Ana María', email: 'ana@test.com' });
      expect(perfil).not.toHaveProperty('passwordHash');
    });
  });

  describe('obtenerPorId', () => {
    it('lanza 404 si el usuario no existe', () => {
      const admin = crearUsuario(repositorio, 'admin@test.com', 'administrador');

      expect(() => service.obtenerPorId(999, token(admin))).toThrow(NotFoundException);
    });

    it('permite al mismo usuario y al administrador, y prohíbe a otros', () => {
      const ana = crearUsuario(repositorio, 'ana@test.com');
      const luis = crearUsuario(repositorio, 'luis@test.com');
      const admin = crearUsuario(repositorio, 'admin@test.com', 'administrador');

      expect(service.obtenerPorId(ana.id, token(ana)).id).toBe(ana.id);
      expect(service.obtenerPorId(ana.id, token(admin)).id).toBe(ana.id);
      expect(() => service.obtenerPorId(ana.id, token(luis))).toThrow(ForbiddenException);
    });
  });

  it('obtenerPerfil lanza 404 si el usuario del token ya no existe', () => {
    expect(() => service.obtenerPerfil(42)).toThrow(NotFoundException);
  });

  it('listar nunca incluye passwordHash', () => {
    crearUsuario(repositorio, 'ana@test.com');
    crearUsuario(repositorio, 'luis@test.com');

    const usuarios = service.listar();

    expect(usuarios).toHaveLength(2);
    usuarios.forEach((u) => expect(u).not.toHaveProperty('passwordHash'));
  });

  it('cambiarEstado actualiza el estado y lanza 404 si no existe', () => {
    const ana = crearUsuario(repositorio, 'ana@test.com');

    expect(service.cambiarEstado(ana.id, 'inactivo').estado).toBe('inactivo');
    expect(repositorio.buscarPorId(ana.id)?.estado).toBe('inactivo');
    expect(() => service.cambiarEstado(999, 'activo')).toThrow(NotFoundException);
  });
});
