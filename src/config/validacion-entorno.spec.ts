import { esquemaEntorno, opcionesValidacionEntorno } from './validacion-entorno';

// Valores de ejemplo solo para pruebas.
const ENTORNO_BASE = {
  PORT: '3000',
  NODE_ENV: 'test',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'huellitas_unidas_test',
  POSTGRES_USER: 'huellitas',
  POSTGRES_PASSWORD: 'contrasena-de-ejemplo',
  JWT_SECRET: 'secreto-jwt-de-ejemplo-solo-para-pruebas',
  CORS_ORIGINS: 'http://localhost:4200',
  URL_FIRMADA_SECRETO: 'secreto-url-firmada-de-ejemplo-para-pruebas',
};

function validar(cambios: Record<string, string | undefined> = {}) {
  return esquemaEntorno.validate({ ...ENTORNO_BASE, ...cambios }, opcionesValidacionEntorno);
}

describe('esquemaEntorno: almacenamiento', () => {
  it('aplica los valores por defecto de ALMACENAMIENTO_DIR y URL_FIRMADA_EXPIRA_SEGUNDOS', () => {
    const { error, value } = validar();

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ ALMACENAMIENTO_DIR: 'uploads', URL_FIRMADA_EXPIRA_SEGUNDOS: 300 });
  });

  it('convierte URL_FIRMADA_EXPIRA_SEGUNDOS a número', () => {
    expect(validar({ URL_FIRMADA_EXPIRA_SEGUNDOS: '120' }).value).toMatchObject({ URL_FIRMADA_EXPIRA_SEGUNDOS: 120 });
  });

  it('exige URL_FIRMADA_SECRETO', () => {
    expect(validar({ URL_FIRMADA_SECRETO: undefined }).error?.message).toBe(
      'Falta la variable de entorno URL_FIRMADA_SECRETO',
    );
  });

  it('rechaza un URL_FIRMADA_SECRETO de menos de 32 caracteres', () => {
    expect(validar({ URL_FIRMADA_SECRETO: 'corto' }).error?.message).toBe(
      'La variable de entorno URL_FIRMADA_SECRETO debe tener al menos 32 caracteres',
    );
  });

  it.each([
    ['0', 'debe ser un número positivo'],
    ['1.5', 'debe ser un número entero'],
    ['abc', 'debe ser un número'],
  ])('rechaza URL_FIRMADA_EXPIRA_SEGUNDOS=%s', (valor, mensaje) => {
    expect(validar({ URL_FIRMADA_EXPIRA_SEGUNDOS: valor }).error?.message).toBe(
      `La variable de entorno URL_FIRMADA_EXPIRA_SEGUNDOS ${mensaje}`,
    );
  });
});
