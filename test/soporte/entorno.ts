import { existsSync } from 'node:fs';

// En local las variables salen de .env.test; en la CI ya vienen definidas en el entorno
// (process.loadEnvFile no sobrescribe las existentes).
export function cargarEntornoDePrueba(): void {
  process.env.NODE_ENV = 'test';
  if (existsSync('.env.test')) {
    process.loadEnvFile('.env.test');
  }
}
