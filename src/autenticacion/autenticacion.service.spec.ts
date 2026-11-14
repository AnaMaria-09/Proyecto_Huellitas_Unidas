import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { crearUsuario, crearUsuariosRepositorioMock, UsuariosRepositorioMock } from '../usuarios/testing/usuario.fixture';
import type { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { AutenticacionService } from './autenticacion.service';
import type { ContrasenasService } from './contrasenas.service';
import type { ParTokens, TokensService } from './tokens.service';

describe('AutenticacionService', () => {
  let usuarios: UsuariosRepositorioMock;
  let contrasenas: { hashear: jest.Mock<ContrasenasService['hashear']>; coincide: jest.Mock<ContrasenasService['coincide']> };
  let tokens: {
    emitir: jest.Mock<TokensService['emitir']>;
    rotar: jest.Mock<TokensService['rotar']>;
    revocar: jest.Mock<TokensService['revocar']>;
    revocarTodos: jest.Mock<TokensService['revocarTodos']>;
  };
  const par: ParTokens = { accessToken: 'access', refreshToken: 'refresh' };
  let service: AutenticacionService;

  const credenciales = { email: 'Ana@test.com', password: 'secreta123' };

  beforeEach(() => {
    usuarios = crearUsuariosRepositorioMock();
    contrasenas = {
      hashear: jest.fn<ContrasenasService['hashear']>().mockResolvedValue('hash'),
      coincide: jest.fn<ContrasenasService['coincide']>().mockResolvedValue(true),
    };
    tokens = {
      emitir: jest.fn<TokensService['emitir']>().mockResolvedValue(par),
      rotar: jest.fn<TokensService['rotar']>().mockResolvedValue(par),
      revocar: jest.fn<TokensService['revocar']>().mockResolvedValue(undefined),
      revocarTodos: jest.fn<TokensService['revocarTodos']>().mockResolvedValue(undefined),
    };
    service = new AutenticacionService(
      usuarios as unknown as UsuariosRepositorio,
      contrasenas as unknown as ContrasenasService,
      tokens as unknown as TokensService,
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
    it('devuelve { accessToken, refreshToken } emitidos para el usuario', async () => {
      const usuario = crearUsuario({ id: 5, rol: 'fundacion', passwordHash: 'hash' });
      usuarios.buscarPorEmailConPassword.mockResolvedValue(usuario);

      await expect(service.iniciarSesion(credenciales)).resolves.toEqual(par);
      expect(tokens.emitir).toHaveBeenCalledWith(usuario);
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
      expect(tokens.emitir).not.toHaveBeenCalled();
    });

    it('a un usuario inactivo con contraseña incorrecta le responde 401, sin revelar el estado', async () => {
      usuarios.buscarPorEmailConPassword.mockResolvedValue(crearUsuario({ estado: 'inactivo', passwordHash: 'hash' }));
      contrasenas.coincide.mockResolvedValue(false);

      await expect(service.iniciarSesion(credenciales)).rejects.toThrow(UnauthorizedException);
    });
  });

  it('refrescarToken delega la rotación en TokensService', async () => {
    await expect(service.refrescarToken({ refreshToken: 'viejo' })).resolves.toEqual(par);
    expect(tokens.rotar).toHaveBeenCalledWith('viejo');
  });

  it('cerrarSesion revoca solo el refresh token recibido, del usuario del token', async () => {
    await service.cerrarSesion(5, { refreshToken: 'actual' });
    expect(tokens.revocar).toHaveBeenCalledWith('actual', 5);
    expect(tokens.revocarTodos).not.toHaveBeenCalled();
  });

  describe('cambiarContrasena', () => {
    const datos = { contrasenaActual: 'secreta123', contrasenaNueva: 'nueva-secreta456' };

    it('verifica la actual, guarda el hash de la nueva y revoca todos los refresh tokens', async () => {
      usuarios.buscarPorIdConPassword.mockResolvedValue(crearUsuario({ id: 5, passwordHash: 'hash-actual' }));
      contrasenas.hashear.mockResolvedValue('hash-nuevo');

      await service.cambiarContrasena(5, datos);

      expect(contrasenas.coincide).toHaveBeenCalledWith('secreta123', 'hash-actual');
      expect(contrasenas.hashear).toHaveBeenCalledWith('nueva-secreta456');
      expect(usuarios.actualizarPasswordHash).toHaveBeenCalledWith(5, 'hash-nuevo');
      expect(tokens.revocarTodos).toHaveBeenCalledWith(5);
    });

    it('rechaza la contraseña actual incorrecta sin cambiar nada', async () => {
      usuarios.buscarPorIdConPassword.mockResolvedValue(crearUsuario({ id: 5, passwordHash: 'hash-actual' }));
      contrasenas.coincide.mockResolvedValue(false);

      await expect(service.cambiarContrasena(5, datos)).rejects.toThrow(
        new BadRequestException('La contraseña actual no es correcta'),
      );
      expect(usuarios.actualizarPasswordHash).not.toHaveBeenCalled();
      expect(tokens.revocarTodos).not.toHaveBeenCalled();
    });

    it('lanza 404 si el usuario del token ya no existe', async () => {
      await expect(service.cambiarContrasena(99, datos)).rejects.toThrow(NotFoundException);
    });
  });
});
