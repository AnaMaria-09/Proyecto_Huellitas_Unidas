import { IsDateString } from 'class-validator';
import { NoEsFechaFutura } from '../validadores/no-es-fecha-futura.validator';

export class ConfirmarEntregaDto {
  @IsDateString({}, { message: 'fechaEntrega debe ser una fecha válida en formato ISO 8601' })
  @NoEsFechaFutura({ message: 'La fecha de entrega no puede ser futura' })
  fechaEntrega: string;
}
