// Con NODE_ENV=test (pruebas e2e) se lee .env.test, con su propia base de datos; si no, .env.
// Las variables ya definidas en el entorno (por ejemplo en la CI) tienen prioridad sobre el archivo.
export function archivoEntorno(nodeEnv: string | undefined = process.env.NODE_ENV): string {
  return nodeEnv === 'test' ? '.env.test' : '.env';
}
