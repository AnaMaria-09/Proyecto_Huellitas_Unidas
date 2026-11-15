// globalTeardown de las pruebas e2e: detiene la API que levantó iniciar-servidor.ts.
export default async function detenerServidor(): Promise<void> {
  const servidor = globalThis.servidorE2e;
  if (!servidor || servidor.exitCode !== null) return;
  await new Promise<void>((resolver) => {
    servidor.once('exit', () => resolver());
    servidor.kill();
  });
}
