import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { crearUsuario } from './testing/usuario.fixture';
import { UsuariosRepositorio } from './usuarios.repositorio';

describe('UsuariosRepositorio', () => {
  const consulta = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn<() => Promise<Usuario | null>>(),
  };
  const typeorm = {
    create: jest.fn((datos: Partial<Usuario>) => crearUsuario(datos)),
    save: jest.fn((usuario: Usuario) => Promise.resolve(usuario)),
    findOneBy: jest.fn<() => Promise<Usuario | null>>(),
    findOneByOrFail: jest.fn<() => Promise<Usuario>>(),
    findAndCount: jest.fn<() => Promise<[Usuario[], number]>>(),
    existsBy: jest.fn<() => Promise<boolean>>(),
    createQueryBuilder: jest.fn(() => consulta),
  };
  let repositorio: UsuariosRepositorio;

  beforeEach(async () => {
    jest.clearAllMocks();
    const modulo = await Test.createTestingModule({
      providers: [UsuariosRepositorio, { provide: getRepositoryToken(Usuario), useValue: typeorm }],
    }).compile();
    repositorio = modulo.get(UsuariosRepositorio);
  });

  it('guardar normaliza el email y relee el usuario sin passwordHash', async () => {
    const releido = crearUsuario({ id: 7, email: 'ana@test.com' });
    typeorm.findOneByOrFail.mockResolvedValue(releido);

    const usuario = await repositorio.guardar({ nombre: 'Ana', email: 'ANA@Test.com', passwordHash: 'hash', rol: 'ciudadano' });

    expect(typeorm.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@test.com', passwordHash: 'hash' }));
    expect(usuario).toBe(releido);
  });

  it('buscarPorEmail busca en minúsculas', async () => {
    typeorm.findOneBy.mockResolvedValue(null);
    await expect(repositorio.buscarPorEmail('ANA@test.com')).resolves.toBeNull();
    expect(typeorm.findOneBy).toHaveBeenCalledWith({ email: 'ana@test.com' });
  });

  it('buscarPorEmailConPassword selecciona passwordHash explícitamente', async () => {
    const conHash = crearUsuario({ passwordHash: 'hash' });
    consulta.getOne.mockResolvedValue(conHash);

    await expect(repositorio.buscarPorEmailConPassword('ANA@test.com')).resolves.toBe(conHash);
    expect(consulta.addSelect).toHaveBeenCalledWith('usuario.passwordHash');
    expect(consulta.where).toHaveBeenCalledWith('usuario.email = :email', { email: 'ana@test.com' });
  });

  it('listarFundacionesVerificadas filtra por rol y verificada', async () => {
    typeorm.findAndCount.mockResolvedValue([[], 0]);
    await repositorio.listarFundacionesVerificadas({ skip: 20, take: 10 });
    expect(typeorm.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rol: 'fundacion', verificada: true }, skip: 20, take: 10 }),
    );
  });
});
