import { registerDecorator } from 'class-validator';
import type { ValidationArguments, ValidationOptions } from 'class-validator';

// Rechaza el valor si es igual al de otra propiedad del mismo objeto.
export function DistintaDe(otraPropiedad: string, opciones?: ValidationOptions): PropertyDecorator {
  return (objeto: object, propiedad: string | symbol) => {
    registerDecorator({
      name: 'distintaDe',
      target: objeto.constructor,
      propertyName: propiedad.toString(),
      constraints: [otraPropiedad],
      options: opciones,
      validator: {
        validate(valor: unknown, argumentos: ValidationArguments): boolean {
          const otroValor = (argumentos.object as Record<string, unknown>)[otraPropiedad];
          return valor !== otroValor;
        },
        defaultMessage(argumentos: ValidationArguments): string {
          return `${argumentos.property} debe ser distinta de ${otraPropiedad}`;
        },
      },
    });
  };
}
