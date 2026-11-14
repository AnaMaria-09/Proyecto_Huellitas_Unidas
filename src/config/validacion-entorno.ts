import Joi from 'joi';
import { PATRON_DURACION } from './duracion';
import type { VariablesEntorno } from './env.model';

export const esquemaEntorno = Joi.object<VariablesEntorno, true>({
  PORT: Joi.number().port().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().pattern(PATRON_DURACION, 'duración').default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().pattern(PATRON_DURACION, 'duración').default('7d'),

  CORS_ORIGINS: Joi.string().required(),

  OBSERVE_APP_KEY: Joi.string().optional(),
  OBSERVE_APP_SECRET: Joi.string().optional(),

  // Administrador inicial: opcionales, pero si se define una hay que definir la otra.
  ADMIN_EMAIL: Joi.string().email({ tlds: { allow: false } }).optional(),
  ADMIN_PASSWORD: Joi.string().min(8).max(64).optional(),
})
  .and('ADMIN_EMAIL', 'ADMIN_PASSWORD')
  .prefs({
    messages: {
      'any.required': 'Falta la variable de entorno {#label}',
      'any.only': 'La variable de entorno {#label} debe ser uno de: {#valids}',
      'string.min': 'La variable de entorno {#label} debe tener al menos {#limit} caracteres',
      'number.base': 'La variable de entorno {#label} debe ser un número',
      'number.port': 'La variable de entorno {#label} debe ser un puerto válido',
      'string.empty': 'La variable de entorno {#label} no puede estar vacía',
      'string.max': 'La variable de entorno {#label} debe tener como máximo {#limit} caracteres',
      'string.email': 'La variable de entorno {#label} debe ser un email válido',
      'string.pattern.name': 'La variable de entorno {#label} debe ser una duración como 15m, 12h o 7d',
    'object.and': 'Las variables de entorno {#presentWithLabels} y {#missingWithLabels} deben definirse juntas',
    },
    errors: { wrap: { label: false } },
  });

// Las mismas opciones que ConfigModule aplica a Joi; las usa data-source.ts, que valida por su cuenta.
// abortEarly: false lista todas las variables que fallan; allowUnknown: true porque process.env
// trae muchas variables del sistema.
export const opcionesValidacionEntorno: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
};
