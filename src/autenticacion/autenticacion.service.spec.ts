import { jest } from '@jest/globals';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { crearUsuario, crearUsuariosRepositorioMock, UsuariosRepositorioMock } from '../usuarios/testing/usuario.fixture';
import type { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { AutenticacionService } from './autenticacion.service';
import type { ContrasenasService } from './contrasenas.service';

describe('AutenticacionService', () => {
  let usuarios: UsuariosRepositorioMock;
  let contrasenas: { hashear: jest.Mock<ContrasenasService['hashear']>; coincide: jest.Mock<ContrasenasService['coincide']> };
  let jwt: { signAsync: jest.Mock<(payload: object) => Promise<string>> };
  let service: AutenticacionService;

  const credenciales = { email: 'Ana@test.com', password: 'secreta123' };

  beforeEach(() => {
    usuarios = crearUsuariosRepositorioMock();
    contrasenas = {
      hashear: jest.fn<ContrasenasService['hashear']>().mockResolvedValue('hash'),
      coincide: jest.fn<ContrasenasService['coincide']>().mockResolvedValue(true),
    };
    jwt = { signAsync: jest.fn<(payload: object) => Promise<string>>().mockResolvedValue('token') };
    service = new AutenticacionService(
      jwt as unknown as JwtService,
      usuarios as unknown as UsuariosRepositorio,
      contrasenas as unknown as ContrasenasService,
    );
  });

  describe('registrar', () => {
    it('guarda el hash, nunca la contraseña, y no devuelve passwordHash', async () => {
      usuarios.guardar.mockResolvedValue(crearUsuario({ id: 5, email: 'ana@test.com' }));

      const usuario = await service.registrar({ nombre: 'Ana', ...credenciales, rol: 'ciudadano' });

      expect(usuarios.guardar).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hash' }));
      expect(usuarios.guardar).not.toHaveBeenCalledWith(expect.objectContaining({ password: expect.anything() }));
      expect(usuario).not.toHaveProperty('passwordHash');
    });

    it('rechaza un email ya registrado', async () => {
      usuarios.buscarPorEmail.mockResolvedValue(crearUsuario());
      await expect(service.registrar({ nombre: 'Ana', ...credenciales, rol: 'ciudadano' })).rejects.toThrow(ConflictException);
    });
  });

  describe('iniciarSesion', () => {
    it('devuelve un access token con sub, rol y email', async () => {
      usuarios.buscarPorEmailConPassword.mockResolvedValue(crearUsuario({ id: 5, rol: 'fundacion', passwordHash: 'hash' }));

      await expect(service.iniciarSesion(credenciales)).resolves.toEqual({ accessToken: 'token' });
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 5, rol: 'fundacion', email: 'prueba@test.com' }, { expiresIn: '1h' });
    });

    it('responde lo mismo si el email no existe o la contraseña no coincide', async () => {
      await expect(service.iniciarSesion(credenciales)).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));

      usuarios.buscarPorEmailConPassword.mockResolvedValue(crearUsuario({ passwordHash: 'hash' }));
      contrasenas.coincide.mockResolvedValue(false);
      await expect(service.iniciarSesion(credenciales)).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
    });

    it('un usuario inactivo no puede iniciar sesión', async () => {
      usuarios.buscarPorEmailConPassword.mockResolvedValue(crearUsuario({ estado: 'inactivo', passwordHash: 'hash' }));

      await expect(service.iniciarSesion(credenciales)).rejects.toThrow(new ForbiddenException('La cuenta está desactivada'));
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('a un usuario inactivo con contraseña incorrecta le responde 401, sin revelar el estado', async () => {
      usuarios.buscarPorEmailConPassword.mockResolvedValue(crearUsuario({ estado: 'inactivo', passwordHash: 'hash' }));
      contrasenas.coincide.mockResolvedValue(false);

      await expect(service.iniciarSesion(credenciales)).rejects.toThrow(UnauthorizedException);
    });
  });
});
