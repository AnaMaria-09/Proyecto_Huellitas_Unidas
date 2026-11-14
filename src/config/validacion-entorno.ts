import Joi from 'joi';
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

  OBSERVE_APP_KEY: Joi.string().optional(),
  OBSERVE_APP_SECRET: Joi.string().optional(),
}).prefs({
  messages: {
    'any.required': 'Falta la variable de entorno {#label}',
    'any.only': 'La variable de entorno {#label} debe ser uno de: {#valids}',
    'string.min': 'La variable de entorno {#label} debe tener al menos {#limit} caracteres',
    'number.base': 'La variable de entorno {#label} debe ser un número',
    'number.port': 'La variable de entorno {#label} debe ser un puerto válido',
    'string.empty': 'La variable de entorno {#label} no puede estar vacía',
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
