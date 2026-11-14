export type EntornoNode = 'development' | 'production' | 'test';

// Variables de entorno ya validadas por esquemaEntorno. Usar con
// ConfigService<VariablesEntorno, true> y config.get('X', { infer: true }).
export interface VariablesEntorno {
  PORT: number;
  NODE_ENV: EntornoNode;

  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;

  JWT_SECRET: string;
  // Duraciones como "15m" o "7d" (ver duracion.ts).
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // Orígenes permitidos por CORS, separados por comas.
  CORS_ORIGINS: string;

  OBSERVE_APP_KEY?: string;
  OBSERVE_APP_SECRET?: string;

  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}
