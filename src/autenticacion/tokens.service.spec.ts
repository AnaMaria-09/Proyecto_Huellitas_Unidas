import { jest } from '@jest/globals';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import type { Repository } from 'typeorm';
import type { VariablesEntorno } from '../config/env.model';
import type { Usuario } from '../usuarios/entities/usuario.entity';
import { crearUsuario } from '../usuarios/testing/usuario.fixture';
import type { TokenRefresco } from './entities/token-refresco.entity';
import { RepositorioTokensFake } from './testing/repositorio-tokens.fake';
import { TokensService } from './tokens.service';

const SECRETO = 'secreto-de-prueba-de-al-menos-32-caracteres';

describe('TokensService', () => {
  let usuarios: Map<number, Usuario>;
  let repositorio: RepositorioTokensFake;
  let jwt: JwtService;
  let service: TokensService;
  const ana = crearUsuario({ id: 1, email: 'ana@test.com', rol: 'ciudadano' });
  const luis = crearUsuario({ id: 2, email: 'luis@test.com' });

  beforeEach(() => {
    usuarios = new Map([
      [ana.id, { ...ana } as Usuario],
      [luis.id, { ...luis } as Usuario],
    ]);
    repositorio = new RepositorioTokensFake(usuarios);
    jwt = new JwtService({ secret: SECRETO });
    const variables: Partial<VariablesEntorno> = { JWT_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d' };
    const config = { get: (clave: keyof VariablesEntorno) => variables[clave] };
    service = new TokensService(
      jwt,
      repositorio as unknown as Repository<TokenRefresco>,
      config as unknown as ConfigService<VariablesEntorno, true>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('emitir', () => {
    it('firma un access token de 15 minutos con sub, rol y email', async () => {
      const { accessToken } = await service.emitir(ana);
      const payload = await jwt.verifyAsync<{ sub: number; rol: string; email: string; iat: number; exp: number }>(accessToken);

      expect(payload).toMatchObject({ sub: 1, rol: 'ciudadano', email: 'ana@test.com' });
      expect(payload.exp - payload.iat).toBe(15 * 60);
    });

    it('guarda solo el hash SHA-256 del refresh token, con vencimiento a 7 días', async () => {
      const { refreshToken } = await service.emitir(ana);
      const [fila] = repositorio.filas;

      expect(fila.tokenHash).toBe(createHash('sha256').update(refreshToken).digest('hex'));
      expect(JSON.stringify(repositorio.filas)).not.toContain(refreshToken);
      expect(fila.expiraEn.getTime() - Date.now()).toBeGreaterThan(7 * 86_400_000 - 5_000);
      expect(fila.revocadoEn).toBeNull();
    });
  });

  describe('rotar', () => {
    it('revoca el token usado y emite un par nuevo que sí sirve', async () => {
      const inicial = await service.emitir(ana);

      const nuevo = await service.rotar(inicial.refreshToken);

      expect(nuevo.refreshToken).not.toBe(inicial.refreshToken);
      expect(repositorio.filas[0].revocadoEn).toBeInstanceOf(Date);
      expect(repositorio.filas[1].revocadoEn).toBeNull();
      await expect(service.rotar(nuevo.refreshToken)).resolves.toHaveProperty('accessToken');
    });

    it('detecta la reutilización de un token revocado: responde 401 y revoca todos los del usuario', async () => {
      const inicial = await service.emitir(ana);
      const otraSesion = await service.emitir(ana);
      const deLuis = await service.emitir(luis);
      const rotado = await service.rotar(inicial.refreshToken);

      await expect(service.rotar(inicial.refreshToken)).rejects.toThrow(/ya fue usado/);

      const activosDeAna = repositorio.filas.filter((t) => t.usuarioId === ana.id && t.revocadoEn === null);
      expect(activosDeAna).toHaveLength(0);
      await expect(service.rotar(rotado.refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.rotar(otraSesion.refreshToken)).rejects.toThrow(UnauthorizedException);
      // Las sesiones de otros usuarios no se tocan.
      await expect(service.rotar(deLuis.refreshToken)).resolves.toHaveProperty('refreshToken');
    });

    it('rechaza un token desconocido', async () => {
      await expect(service.rotar('no-existe')).rejects.toThrow(new UnauthorizedException('Token de refresco inválido o vencido'));
    });

    it('rechaza un token vencido', async () => {
      const { refreshToken } = await service.emitir(ana);
      jest.useFakeTimers({ now: Date.now() + 8 * 86_400_000 });

      await expect(service.rotar(refreshToken)).rejects.toThrow(new UnauthorizedException('Token de refresco inválido o vencido'));
    });

    it('si el usuario se desactivó responde 403 y revoca sus tokens', async () => {
      const { refreshToken } = await service.emitir(ana);
      usuarios.get(ana.id)!.estado = 'inactivo';

      await expect(service.rotar(refreshToken)).rejects.toThrow(ForbiddenException);
      expect(repositorio.filas[0].revocadoEn).toBeInstanceOf(Date);
    });

    it('si otra petición revocó el token entre la lectura y la revocación, lo trata como reutilización', async () => {
      const { refreshToken } = await service.emitir(ana);
      const update = repositorio.update.bind(repositorio);
      jest.spyOn(repositorio, 'update').mockImplementationOnce(async () => ({ affected: 0 })).mockImplementation(update);

      await expect(service.rotar(refreshToken)).rejects.toThrow(/ya fue usado/);
      expect(repositorio.filas[0].revocadoEn).toBeInstanceOf(Date);
    });
  });

  describe('revocar', () => {
    it('revoca solo el token indicado del propio usuario', async () => {
      const sesion1 = await service.emitir(ana);
      const sesion2 = await service.emitir(ana);

      await service.revocar(sesion1.refreshToken, ana.id);

      expect(repositorio.filas.map((t) => t.revocadoEn === null)).toEqual([false, true]);
      await expect(service.rotar(sesion2.refreshToken)).resolves.toHaveProperty('accessToken');
    });

    it('no revoca tokens de otro usuario', async () => {
      const deAna = await service.emitir(ana);

      await service.revocar(deAna.refreshToken, luis.id);

      expect(repositorio.filas[0].revocadoEn).toBeNull();
    });
  });

  it('revocarTodos revoca todas las sesiones activas del usuario', async () => {
    await service.emitir(ana);
    await service.emitir(ana);
    await service.emitir(luis);

    await service.revocarTodos(ana.id);

    expect(repositorio.filas.map((t) => [t.usuarioId, t.revocadoEn === null])).toEqual([
      [1, false],
      [1, false],
      [2, true],
    ]);
  });
});
