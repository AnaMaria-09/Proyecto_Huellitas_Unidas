import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

// Campos de texto del formulario multipart; las imágenes llegan en el campo "imagenes".
export class SubirImagenesDto {
  @ApiProperty({ example: 1, minimum: 1, description: 'Mascota a la que pertenecen las imágenes' })
  @Type(() => Number)
  @IsInt({ message: 'mascotaId debe ser un número entero' })
  @Min(1, { message: 'mascotaId debe ser mayor o igual a 1' })
  mascotaId: number;
}
