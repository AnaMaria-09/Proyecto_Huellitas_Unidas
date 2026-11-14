// Reemplazo de @nestjs/throttler solo para las pruebas unitarias (ver jest.config.ts).
// El paquete se publica como CommonJS y hace require('@nestjs/common'), que en Nest 12 es ESM;
// en el modo ESM de Jest ese require cae en un ciclo. En la aplicación compilada funciona normal.
export function Throttle(): MethodDecorator & ClassDecorator {
  return () => undefined;
}

export function SkipThrottle(): MethodDecorator & ClassDecorator {
  return () => undefined;
}
