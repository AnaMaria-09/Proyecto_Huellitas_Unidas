import type { ConfigModuleOptions } from '@nestjs/config';
import { archivoEntorno } from './archivo-entorno';
import { esquemaEntorno } from './validacion-entorno';

// Si falta una variable obligatoria, ConfigModule lanza un error que la nombra
// y la aplicación no arranca. Con Joi, ConfigModule ya usa abortEarly: false
// (lista todas las que fallan) y allowUnknown: true.
export const opcionesConfiguracion: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: archivoEntorno(),
  validationSchema: esquemaEntorno,
};
