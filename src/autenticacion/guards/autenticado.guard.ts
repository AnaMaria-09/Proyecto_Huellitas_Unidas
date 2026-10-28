import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { obtenerJwtSecreto } from '../jwt-secreto';
import { PayloadJwt } from '../usuario.model';

export interface RequestConUsuario extends Request {
  usuario?: PayloadJwt;
}

export function extraerToken(request: Request): string | undefined {
  const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
  return tipo === 'Bearer' && token ? token : undefined;
}

export async function verificarToken(jwtService: JwtService, token: string): Promise<PayloadJwt> {
  try {
    return await jwtService.verifyAsync<PayloadJwt>(token, { secret: obtenerJwtSecreto() });
  } catch {
    throw new UnauthorizedException('Token de acceso inválido');
  }
}

@Injectable()
export class AutenticadoGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const token = extraerToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }
    request.usuario = await verificarToken(this.jwtService, token);
    return true;
  }
}
