import { registerDecorator } from 'class-validator';
import type { ValidationArguments, ValidationOptions } from 'class-validator';

// Rechaza fechas posteriores al momento de la validación. Los valores no interpretables
// como fecha se dejan pasar para que los reporte IsDateString.
export function NoEsFechaFutura(opciones?: ValidationOptions): PropertyDecorator {
  return (objeto: object, propiedad: string | symbol) => {
    registerDecorator({
      name: 'noEsFechaFutura',
      target: objeto.constructor,
      propertyName: propiedad.toString(),
      options: opciones,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') {
            return true;
          }
          const fecha = new Date(valor);
          if (Number.isNaN(fecha.getTime())) {
            return true;
          }
          return fecha.getTime() <= Date.now();
        },
        defaultMessage(argumentos: ValidationArguments): string {
          return `${argumentos.property} no puede ser una fecha futura`;
        },
      },
    });
  };
}
