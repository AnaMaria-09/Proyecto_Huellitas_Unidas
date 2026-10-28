import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { obtenerJwtSecreto } from '../jwt-secreto';
import { PayloadJwt } from '../usuario.model';

export interface RequestConUsuario extends Request {
  usuario?: PayloadJwt;
}

@Injectable()
export class AutenticadoGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      request.usuario = await this.jwtService.verifyAsync<PayloadJwt>(token, {
        secret: obtenerJwtSecreto(),
      });
    } catch {
      throw new UnauthorizedException('Token de acceso inválido');
    }
    return true;
  }
}
