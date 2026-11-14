import { jest } from '@jest/globals';
import type { ConfigService } from '@nestjs/config';
import type { ContrasenasService } from '../autenticacion/contrasenas.service';
import type { VariablesEntorno } from '../config/env.model';
import { AdministradorInicialService } from './administrador-inicial.service';
import { crearUsuario, crearUsuariosRepositorioMock, UsuariosRepositorioMock } from './testing/usuario.fixture';
import type { UsuariosRepositorio } from './usuarios.repositorio';

describe('AdministradorInicialService', () => {
  let usuarios: UsuariosRepositorioMock;
  let service: AdministradorInicialService;

  function crearServicio(variables: Partial<VariablesEntorno>) {
    const config = { get: (clave: keyof VariablesEntorno) => variables[clave] };
    const contrasenas = { hashear: jest.fn<ContrasenasService['hashear']>().mockResolvedValue('hash') };
    service = new AdministradorInicialService(
      usuarios as unknown as UsuariosRepositorio,
      contrasenas as unknown as ContrasenasService,
      config as unknown as ConfigService<VariablesEntorno, true>,
    );
  }

  beforeEach(() => {
    usuarios = crearUsuariosRepositorioMock();
  });

  it('crea el administrador con la contraseña hasheada si no existe ninguno', async () => {
    crearServicio({ ADMIN_EMAIL: 'admin@test.com', ADMIN_PASSWORD: 'secreta123' });

    await service.onApplicationBootstrap();

    expect(usuarios.guardar).toHaveBeenCalledWith({
      nombre: 'Administrador',
      email: 'admin@test.com',
      passwordHash: 'hash',
      rol: 'administrador',
    });
  });

  it('no hace nada si ya existe un administrador', async () => {
    crearServicio({ ADMIN_EMAIL: 'admin@test.com', ADMIN_PASSWORD: 'secreta123' });
    usuarios.existeConRol.mockResolvedValue(true);

    await service.onApplicationBootstrap();

    expect(usuarios.guardar).not.toHaveBeenCalled();
  });

  it('no hace nada si faltan las variables', async () => {
    crearServicio({});

    await service.onApplicationBootstrap();

    expect(usuarios.existeConRol).not.toHaveBeenCalled();
    expect(usuarios.guardar).not.toHaveBeenCalled();
  });

  it('no convierte en administrador a un usuario existente con ese email', async () => {
    crearServicio({ ADMIN_EMAIL: 'ana@test.com', ADMIN_PASSWORD: 'secreta123' });
    usuarios.buscarPorEmail.mockResolvedValue(crearUsuario({ email: 'ana@test.com' }));

    await service.onApplicationBootstrap();

    expect(usuarios.guardar).not.toHaveBeenCalled();
    expect(usuarios.actualizar).not.toHaveBeenCalled();
  });
});
