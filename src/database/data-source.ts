import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import type { VariablesEntorno } from '../config/env.model';
import { esquemaEntorno, opcionesValidacionEntorno } from '../config/validacion-entorno';
import { opcionesPostgres } from './opciones-postgres';

// DataSource para el CLI de TypeORM (npm run migration:*). La aplicación no lo usa:
// se conecta con DatabaseModule y autoLoadEntities.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const { error, value } = esquemaEntorno.validate(process.env, opcionesValidacionEntorno);
if (error) {
  throw new Error(`Configuración inválida: ${error.message}`);
}
const env = value as VariablesEntorno;

// Con ts-node se cargan los .ts de src/; con el build, los .js de dist/.
const extension = __filename.endsWith('.ts') ? 'ts' : 'js';

export default new DataSource({
  ...opcionesPostgres(env),
  // El CLI nunca sincroniza: genera y aplica migraciones.
  synchronize: false,
  entities: [join(__dirname, '..', '**', `*.entity.${extension}`)],
  migrations: [join(__dirname, 'migrations', `*.${extension}`)],
});
