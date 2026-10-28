import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestConUsuario } from '../guards/autenticado.guard';
import { PayloadJwt } from '../usuario.model';

// Payload del token guardado por AutenticadoGuard (o AutenticacionOpcionalGuard).
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, context: ExecutionContext): PayloadJwt | undefined =>
    context.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
