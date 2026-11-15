import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateMascotaDto {
  @ApiProperty({ example: 'Firulais', maxLength: 80 })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(1, 80, { message: 'El nombre debe tener entre 1 y 80 caracteres' })
  nombre: string;

  @ApiProperty({ enum: ['perro', 'gato', 'otro'] })
  @IsIn(['perro', 'gato', 'otro'], { message: 'La especie debe ser una de: perro, gato, otro' })
  especie: 'perro' | 'gato' | 'otro';

  @ApiProperty({ enum: ['pequeno', 'mediano', 'grande'] })
  @IsIn(['pequeno', 'mediano', 'grande'], { message: 'El tamaño debe ser uno de: pequeno, mediano, grande' })
  tamano: 'pequeno' | 'mediano' | 'grande';

  @ApiProperty({ example: 24, minimum: 0, maximum: 400 })
  @IsInt({ message: 'edadMeses debe ser un número entero' })
  @Min(0, { message: 'edadMeses no puede ser negativa' })
  @Max(400, { message: 'edadMeses no puede ser mayor que 400' })
  edadMeses: number;

  @ApiProperty({ enum: ['macho', 'hembra', 'desconocido'] })
  @IsIn(['macho', 'hembra', 'desconocido'], { message: 'El sexo debe ser uno de: macho, hembra, desconocido' })
  sexo: 'macho' | 'hembra' | 'desconocido';

  @ApiProperty({ example: 'Bogotá' })
  @IsString({ message: 'La ciudad debe ser un texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  ciudad: string;

  @ApiPropertyOptional({ example: 'Juguetón y vacunado', maxLength: 1000 })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @Length(0, 1000, { message: 'La descripción no puede superar los 1000 caracteres' })
  descripcion?: string;
}
