import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PayloadJwt, Rol, Usuario } from '../autenticacion/usuario.model';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ActualizarFundacionDto } from './dto/actualizar-fundacion.dto';
import { FundacionesService } from './fundaciones.service';

function crearUsuario(repositorio: UsuariosRepositorio, email: string, rol: Rol): Usuario {
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

describe('FundacionesService', () => {
  let repositorio: UsuariosRepositorio;
  let service: FundacionesService;
  let fundacion: Usuario;
  let admin: Usuario;
  let ciudadano: Usuario;

  beforeEach(() => {
    repositorio = new UsuariosRepositorio();
    service = new FundacionesService(repositorio);
    fundacion = crearUsuario(repositorio, 'patitas@test.com', 'fundacion');
    // El administrador se crea directo en el repositorio: el registro público no lo permite.
    admin = crearUsuario(repositorio, 'admin@test.com', 'administrador');
    ciudadano = crearUsuario(repositorio, 'ana@test.com', 'ciudadano');
  });

  describe('fundación no verificada', () => {
    it('no aparece en el listado público', () => {
      expect(service.listarVerificadas()).toEqual([]);
    });

    it('responde 404 al público y a otros usuarios', () => {
      expect(() => service.obtenerPorId(fundacion.id)).toThrow(NotFoundException);
      expect(() => service.obtenerPorId(fundacion.id, token(ciudadano))).toThrow(NotFoundException);
    });

    it('es visible para la propia fundación y para el administrador', () => {
      expect(service.obtenerPorId(fundacion.id, token(fundacion)).verificada).toBe(false);
      expect(service.obtenerPorId(fundacion.id, token(admin)).id).toBe(fundacion.id);
    });
  });

  describe('cambiarVerificacion', () => {
    it('solo la permite a un administrador', () => {
      expect(() => service.cambiarVerificacion(fundacion.id, true, token(fundacion))).toThrow(ForbiddenException);
      expect(() => service.cambiarVerificacion(fundacion.id, true, token(ciudadano))).toThrow(ForbiddenException);
      expect(repositorio.buscarPorId(fundacion.id)?.verificada).toBeUndefined();
    });

    it('con un administrador la fundación pasa a ser pública', () => {
      service.cambiarVerificacion(fundacion.id, true, token(admin));

      expect(service.listarVerificadas().map((f) => f.id)).toEqual([fundacion.id]);
      expect(service.obtenerPorId(fundacion.id).verificada).toBe(true);
    });

    it('lanza 404 si el id no es de una fundación', () => {
      expect(() => service.cambiarVerificacion(ciudadano.id, true, token(admin))).toThrow(NotFoundException);
    });
  });

  it('actualizarMiFundacion cambia los datos de organización pero nunca verificada', () => {
    const datos = {
      nombreOrganizacion: 'Patitas Felices',
      ciudad: 'Medellín',
      verificada: true,
    } as ActualizarFundacionDto;

    const actualizada = service.actualizarMiFundacion(fundacion.id, datos);

    expect(actualizada).toMatchObject({ nombreOrganizacion: 'Patitas Felices', ciudad: 'Medellín', verificada: false });
    expect(actualizada).not.toHaveProperty('passwordHash');
    expect(service.listarVerificadas()).toEqual([]);
  });
});
