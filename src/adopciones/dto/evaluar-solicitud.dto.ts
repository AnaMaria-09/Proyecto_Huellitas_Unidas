import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const DECISIONES_EVALUACION = ['aprobada', 'rechazada'] as const;

export type DecisionEvaluacion = (typeof DECISIONES_EVALUACION)[number];

export class EvaluarSolicitudDto {
  @ApiProperty({ enum: DECISIONES_EVALUACION })
  @IsIn(DECISIONES_EVALUACION, {
    message: "La decisión debe ser 'aprobada' o 'rechazada'",
  })
  decision: DecisionEvaluacion;

  // Obligatorio al rechazar; si se envía al aprobar, también se valida.
  @ApiPropertyOptional({
    description: "Obligatorio si la decisión es 'rechazada'",
    example: 'La vivienda no tiene espacio para un perro grande',
    minLength: 5,
    maxLength: 500,
  })
  @ValidateIf(
    (dto: EvaluarSolicitudDto) =>
      dto.decision === 'rechazada' || dto.motivo !== undefined,
  )
  @IsString({ message: 'El motivo es obligatorio al rechazar una solicitud' })
  @Length(5, 500, { message: 'El motivo debe tener entre 5 y 500 caracteres' })
  motivo?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser un texto' })
  @MaxLength(1000, {
    message: 'Las observaciones no pueden superar los 1000 caracteres',
  })
  observaciones?: string;
}
