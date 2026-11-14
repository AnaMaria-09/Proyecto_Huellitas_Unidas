import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { crearUsuario, crearUsuariosRepositorioMock, tokenDe, UsuariosRepositorioMock } from './testing/usuario.fixture';
import { UsuariosRepositorio } from './usuarios.repositorio';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let repositorio: UsuariosRepositorioMock;
  let service: UsuariosService;

  beforeEach(() => {
    repositorio = crearUsuariosRepositorioMock();
    service = new UsuariosService(repositorio as unknown as UsuariosRepositorio);
  });

  describe('actualizarPerfil', () => {
    it('rechaza un email que ya usa otro usuario', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearUsuario({ id: 1, email: 'ana@test.com' }));
      repositorio.buscarPorEmail.mockResolvedValue(crearUsuario({ id: 2, email: 'luis@test.com' }));

      await expect(service.actualizarPerfil(1, { email: 'Luis@test.com' })).rejects.toThrow(ConflictException);
      expect(repositorio.actualizar).not.toHaveBeenCalled();
    });

    it('cambia el nombre, normaliza el email y no devuelve passwordHash', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearUsuario({ id: 1, email: 'ana@test.com', passwordHash: 'hash' }));

      const perfil = await service.actualizarPerfil(1, { nombre: 'Ana María', email: 'ANA.M@test.com' });

      expect(perfil).toMatchObject({ nombre: 'Ana María', email: 'ana.m@test.com' });
      expect(perfil).not.toHaveProperty('passwordHash');
    });
  });

  describe('obtenerPorId', () => {
    it('lanza 404 si el usuario no existe', async () => {
      const admin = crearUsuario({ id: 9, rol: 'administrador' });
      await expect(service.obtenerPorId(999, tokenDe(admin))).rejects.toThrow(NotFoundException);
    });

    it('permite al mismo usuario y al administrador, y prohíbe a otros', async () => {
      const ana = crearUsuario({ id: 1 });
      repositorio.buscarPorId.mockResolvedValue(ana);

      await expect(service.obtenerPorId(1, tokenDe(ana))).resolves.toMatchObject({ id: 1 });
      await expect(service.obtenerPorId(1, tokenDe(crearUsuario({ id: 9, rol: 'administrador' })))).resolves.toMatchObject({ id: 1 });
      await expect(service.obtenerPorId(1, tokenDe(crearUsuario({ id: 2 })))).rejects.toThrow(ForbiddenException);
    });
  });

  it('obtenerPerfil lanza 404 si el usuario del token ya no existe', async () => {
    await expect(service.obtenerPerfil(42)).rejects.toThrow(NotFoundException);
  });

  it('listar pagina y nunca incluye passwordHash', async () => {
    repositorio.listar.mockResolvedValue([[crearUsuario({ id: 3, passwordHash: 'hash' })], 41]);

    const pagina = await service.listar({ pagina: 3, limite: 20 });

    expect(repositorio.listar).toHaveBeenCalledWith({ skip: 40, take: 20 });
    expect(pagina).toMatchObject({ total: 41, pagina: 3, limite: 20 });
    expect(pagina.datos[0]).not.toHaveProperty('passwordHash');
  });

  it('cambiarEstado guarda el nuevo estado y lanza 404 si no existe', async () => {
    repositorio.buscarPorId.mockResolvedValueOnce(crearUsuario({ id: 1 }));

    await expect(service.cambiarEstado(1, 'inactivo')).resolves.toMatchObject({ estado: 'inactivo' });
    expect(repositorio.actualizar).toHaveBeenCalledWith(expect.objectContaining({ id: 1, estado: 'inactivo' }));
    await expect(service.cambiarEstado(999, 'activo')).rejects.toThrow(NotFoundException);
  });

  describe('cambiarRol', () => {
    const admin = crearUsuario({ id: 9, rol: 'administrador' });

    it('cambia el rol de otro usuario', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearUsuario({ id: 1, rol: 'ciudadano' }));

      await expect(service.cambiarRol(1, 'fundacion', tokenDe(admin))).resolves.toMatchObject({ id: 1, rol: 'fundacion' });
      expect(repositorio.actualizar).toHaveBeenCalledWith(expect.objectContaining({ id: 1, rol: 'fundacion' }));
    });

    it('un administrador no puede quitarse su propio rol (409)', async () => {
      repositorio.buscarPorId.mockResolvedValue(admin);

      await expect(service.cambiarRol(9, 'ciudadano', tokenDe(admin))).rejects.toThrow(ConflictException);
      expect(repositorio.actualizar).not.toHaveBeenCalled();
    });

    it('lanza 404 si el usuario no existe', async () => {
      await expect(service.cambiarRol(999, 'fundacion', tokenDe(admin))).rejects.toThrow(NotFoundException);
    });
  });
});
