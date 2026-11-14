import type { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions';
import type { VariablesEntorno } from '../config/env.model';

type VariablesPostgres = Pick<
  VariablesEntorno,
  'NODE_ENV' | 'POSTGRES_HOST' | 'POSTGRES_PORT' | 'POSTGRES_DB' | 'POSTGRES_USER' | 'POSTGRES_PASSWORD'
>;

// Conexión compartida entre la aplicación (TypeOrmModule) y el CLI de migraciones (data-source.ts).
export function opcionesPostgres(env: VariablesPostgres): PostgresDataSourceOptions {
  const desarrollo = env.NODE_ENV === 'development';
  return {
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    // Solo en desarrollo: en producción el esquema cambia únicamente con migraciones.
    synchronize: desarrollo,
    logging: desarrollo,
  };
}
