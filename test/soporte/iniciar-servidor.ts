import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { cargarEntornoDePrueba } from './entorno';

// globalSetup de las pruebas e2e. @nestjs/throttler es CommonJS y en el modo ESM de Jest no se puede
// cargar junto con Nest 12, así que la aplicación no se levanta dentro de Jest: se compila, se aplican
// las migraciones en la base de pruebas y se arranca `node dist/main` con NODE_ENV=test en PORT.
// Las pruebas le hablan por HTTP; globalTeardown la detiene.

const ESPERA_MAXIMA_MS = 60_000;

declare global {
  var servidorE2e: ChildProcess | undefined;
}

function ejecutar(comando: string): void {
  const resultado = spawnSync(comando, {
    env: process.env,
    shell: true,
    encoding: 'utf8',
  });
  if (resultado.status !== 0) {
    throw new Error(
      `Falló "${comando}":\n${resultado.stdout}\n${resultado.stderr}`,
    );
  }
}

async function esperarServidor(
  url: string,
  servidor: ChildProcess,
  salida: string[],
): Promise<void> {
  const limite = Date.now() + ESPERA_MAXIMA_MS;
  while (Date.now() < limite) {
    if (servidor.exitCode !== null) {
      throw new Error(
        `La API terminó al arrancar (código ${servidor.exitCode}):\n${salida.join('')}`,
      );
    }
    try {
      const respuesta = await fetch(url);
      if (respuesta.ok) return;
    } catch {
      // Todavía no escucha.
    }
    await new Promise((resolver) => setTimeout(resolver, 500));
  }
  throw new Error(
    `La API no respondió en ${ESPERA_MAXIMA_MS / 1000} s:\n${salida.join('')}`,
  );
}

export default async function iniciarServidor(): Promise<void> {
  cargarEntornoDePrueba();
  ejecutar('npm run build');
  ejecutar('npm run migration:run');

  const salida: string[] = [];
  const servidor = spawn(process.execPath, ['dist/main'], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  servidor.stdout?.on('data', (parte: Buffer) => salida.push(parte.toString()));
  servidor.stderr?.on('data', (parte: Buffer) => salida.push(parte.toString()));
  globalThis.servidorE2e = servidor;

  await esperarServidor(
    `http://localhost:${process.env.PORT}/api/v1/salud`,
    servidor,
    salida,
  );
}
