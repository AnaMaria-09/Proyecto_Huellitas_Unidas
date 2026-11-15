import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { NoEsFechaFutura } from '../validadores/no-es-fecha-futura.validator';

export class ConfirmarEntregaDto {
  @ApiProperty({
    example: '2026-11-10T15:00:00Z',
    description: 'Fecha ISO 8601; no puede ser futura',
  })
  @IsDateString(
    {},
    { message: 'fechaEntrega debe ser una fecha válida en formato ISO 8601' },
  )
  @NoEsFechaFutura({ message: 'La fecha de entrega no puede ser futura' })
  fechaEntrega: string;
}
