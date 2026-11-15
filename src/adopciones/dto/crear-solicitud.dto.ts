import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CrearSolicitudDto {
  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt({ message: 'mascotaId debe ser un número entero' })
  @Min(1, { message: 'mascotaId debe ser mayor o igual a 1' })
  mascotaId: number;

  @ApiProperty({
    example: 'Tengo un patio grande y mucho tiempo para cuidarlo.',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString({ message: 'El mensaje debe ser un texto' })
  @Length(20, 1000, {
    message: 'El mensaje debe tener entre 20 y 1000 caracteres',
  })
  mensaje: string;
}
