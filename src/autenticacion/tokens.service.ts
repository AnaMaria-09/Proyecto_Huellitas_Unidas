import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { duracionEnMs, duracionEnSegundos } from '../config/duracion';
import type { VariablesEntorno } from '../config/env.model';
import type { Usuario } from '../usuarios/entities/usuario.entity';
import { TokenRefresco } from './entities/token-refresco.entity';
import type { PayloadJwt } from './usuario.model';

export interface ParTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_INVALIDO = 'Token de refresco inválido o vencido';

// Emite, rota y revoca tokens. El access token es un JWT; el refresh token es un valor aleatorio
// del que solo se guarda el hash.
@Injectable()
export class TokensService {
  private readonly accessExpiraSegundos: number;
  private readonly refreshExpiraMs: number;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(TokenRefresco) private readonly tokens: Repository<TokenRefresco>,
    config: ConfigService<VariablesEntorno, true>,
  ) {
    this.accessExpiraSegundos = duracionEnSegundos(config.get('JWT_EXPIRES_IN', { infer: true }));
    this.refreshExpiraMs = duracionEnMs(config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }));
  }

  async emitir(usuario: Usuario): Promise<ParTokens> {
    const payload: PayloadJwt = { sub: usuario.id, rol: usuario.rol, email: usuario.email };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.accessExpiraSegundos });

    const refreshToken = randomBytes(48).toString('base64url');
    await this.tokens.save(
      this.tokens.create({
        usuarioId: usuario.id,
        tokenHash: hashear(refreshToken),
        expiraEn: new Date(Date.now() + this.refreshExpiraMs),
        revocadoEn: null,
      }),
    );
    return { accessToken, refreshToken };
  }

  // Revoca el refresh token recibido y emite un par nuevo. Si el token ya estaba revocado,
  // alguien lo está reutilizando: se revocan todos los tokens del usuario.
  async rotar(refreshToken: string): Promise<ParTokens> {
    const token = await this.tokens.findOne({
      where: { tokenHash: hashear(refreshToken) },
      relations: { usuario: true },
    });
    if (!token?.usuario) {
      throw new UnauthorizedException(TOKEN_INVALIDO);
    }
    if (token.revocadoEn) {
      await this.revocarTodos(token.usuarioId);
      throw new UnauthorizedException('El token de refresco ya fue usado. Por seguridad se cerraron todas las sesiones');
    }
    if (token.expiraEn.getTime() <= Date.now()) {
      throw new UnauthorizedException(TOKEN_INVALIDO);
    }
    if (token.usuario.estado === 'inactivo') {
      await this.revocarTodos(token.usuarioId);
      throw new ForbiddenException('La cuenta está desactivada');
    }

    // Solo una petición puede revocarlo: si otra se adelantó, también es reutilización.
    const { affected } = await this.tokens.update({ id: token.id, revocadoEn: IsNull() }, { revocadoEn: new Date() });
    if (affected !== 1) {
      await this.revocarTodos(token.usuarioId);
      throw new UnauthorizedException('El token de refresco ya fue usado. Por seguridad se cerraron todas las sesiones');
    }
    return this.emitir(token.usuario);
  }

  // Cierra una sesión. Solo revoca tokens del propio usuario; si no existe, no hace nada.
  async revocar(refreshToken: string, usuarioId: number): Promise<void> {
    await this.tokens.update(
      { tokenHash: hashear(refreshToken), usuarioId, revocadoEn: IsNull() },
      { revocadoEn: new Date() },
    );
  }

  async revocarTodos(usuarioId: number): Promise<void> {
    await this.tokens.update({ usuarioId, revocadoEn: IsNull() }, { revocadoEn: new Date() });
  }
}

function hashear(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
