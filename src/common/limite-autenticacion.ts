import { SetMetadata } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Nombre del throttler que limita registro e inicio de sesión (LIMITE_AUTENTICACION_POR_MINUTO).
export const THROTTLER_AUTENTICACION = 'autenticacion';

const CLAVE_LIMITE_AUTENTICACION = 'limiteAutenticacion';
const reflector = new Reflector();

// Marca una ruta para que también la cuente el throttler de autenticación, contra fuerza bruta.
export const LimiteAutenticacion = () =>
  SetMetadata(CLAVE_LIMITE_AUTENTICACION, true);

// skipIf del throttler de autenticación: solo cuenta las rutas marcadas.
export function sinLimiteAutenticacion(contexto: ExecutionContext): boolean {
  return (
    reflector.get<boolean | undefined>(
      CLAVE_LIMITE_AUTENTICACION,
      contexto.getHandler(),
    ) !== true
  );
}
