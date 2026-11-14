import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  crearUsuario,
  crearUsuariosRepositorioMock,
  tokenDe,
  UsuariosRepositorioMock,
} from '../usuarios/testing/usuario.fixture';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ActualizarFundacionDto } from './dto/actualizar-fundacion.dto';
import { FundacionesService } from './fundaciones.service';

describe('FundacionesService', () => {
  let repositorio: UsuariosRepositorioMock;
  let service: FundacionesService;
  const admin = crearUsuario({ id: 2, rol: 'administrador' });
  const ciudadano = crearUsuario({ id: 3, rol: 'ciudadano' });

  function fundacion(verificada = false) {
    return crearUsuario({ id: 1, rol: 'fundacion', email: 'patitas@test.com', verificada });
  }

  beforeEach(() => {
    repositorio = crearUsuariosRepositorioMock();
    service = new FundacionesService(repositorio as unknown as UsuariosRepositorio);
  });

  it('listarVerificadas consulta solo verificadas, paginado', async () => {
    repositorio.listarFundacionesVerificadas.mockResolvedValue([[fundacion(true)], 1]);

    const pagina = await service.listarVerificadas({ pagina: 1, limite: 20 });

    expect(repositorio.listarFundacionesVerificadas).toHaveBeenCalledWith({ skip: 0, take: 20 });
    expect(pagina).toMatchObject({ total: 1, pagina: 1, limite: 20 });
  });

  describe('fundación no verificada', () => {
    it('responde 404 al público y a otros usuarios', async () => {
      repositorio.buscarPorId.mockResolvedValue(fundacion());

      await expect(service.obtenerPorId(1)).rejects.toThrow(NotFoundException);
      await expect(service.obtenerPorId(1, tokenDe(ciudadano))).rejects.toThrow(NotFoundException);
    });

    it('es visible para la propia fundación y para el administrador', async () => {
      repositorio.buscarPorId.mockResolvedValue(fundacion());

      await expect(service.obtenerPorId(1, tokenDe(fundacion()))).resolves.toMatchObject({ verificada: false });
      await expect(service.obtenerPorId(1, tokenDe(admin))).resolves.toMatchObject({ id: 1 });
    });
  });

  describe('cambiarVerificacion', () => {
    it('solo la permite a un administrador', async () => {
      repositorio.buscarPorId.mockResolvedValue(fundacion());

      await expect(service.cambiarVerificacion(1, true, tokenDe(fundacion()))).rejects.toThrow(ForbiddenException);
      await expect(service.cambiarVerificacion(1, true, tokenDe(ciudadano))).rejects.toThrow(ForbiddenException);
      expect(repositorio.actualizar).not.toHaveBeenCalled();
    });

    it('con un administrador guarda verificada', async () => {
      repositorio.buscarPorId.mockResolvedValue(fundacion());

      await expect(service.cambiarVerificacion(1, true, tokenDe(admin))).resolves.toMatchObject({ verificada: true });
      expect(repositorio.actualizar).toHaveBeenCalledWith(expect.objectContaining({ id: 1, verificada: true }));
    });

    it('lanza 404 si el id no es de una fundación', async () => {
      repositorio.buscarPorId.mockResolvedValue(ciudadano);
      await expect(service.cambiarVerificacion(3, true, tokenDe(admin))).rejects.toThrow(NotFoundException);
    });
  });

  it('actualizarMiFundacion cambia los datos de organización pero nunca verificada', async () => {
    repositorio.buscarPorId.mockResolvedValue(fundacion());
    const datos = { nombreOrganizacion: 'Patitas Felices', ciudad: 'Medellín', verificada: true } as ActualizarFundacionDto;

    const actualizada = await service.actualizarMiFundacion(1, datos);

    expect(actualizada).toMatchObject({ nombreOrganizacion: 'Patitas Felices', ciudad: 'Medellín', verificada: false });
    expect(actualizada).not.toHaveProperty('passwordHash');
  });
});
