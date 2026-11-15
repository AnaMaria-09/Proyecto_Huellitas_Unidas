import type { ExecutionContext } from '@nestjs/common';
import {
  LimiteAutenticacion,
  sinLimiteAutenticacion,
} from './limite-autenticacion';

class Rutas {
  @LimiteAutenticacion()
  iniciarSesion(): void {}

  perfil(): void {}
}

function contextoDe(handler: () => void): ExecutionContext {
  return { getHandler: () => handler } as unknown as ExecutionContext;
}

describe('LimiteAutenticacion', () => {
  it('el throttler de autenticación cuenta las rutas marcadas', () => {
    expect(
      sinLimiteAutenticacion(contextoDe(Rutas.prototype.iniciarSesion)),
    ).toBe(false);
  });

  it('y se salta las demás', () => {
    expect(sinLimiteAutenticacion(contextoDe(Rutas.prototype.perfil))).toBe(
      true,
    );
  });
});
