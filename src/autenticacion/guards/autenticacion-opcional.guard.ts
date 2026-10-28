import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { extraerToken, RequestConUsuario, verificarToken } from './autenticado.guard';

// Para rutas públicas que responden distinto si hay sesión: sin token deja pasar
// sin request.usuario; con un token inválido responde 401 igual que AutenticadoGuard.
@Injectable()
export class AutenticacionOpcionalGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const token = extraerToken(request);
    if (token) {
      request.usuario = await verificarToken(this.jwtService, token);
    }
    return true;
  }
}
