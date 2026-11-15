import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

// Mismos campos que CreateMascotaDto, todos opcionales (sin instalar @nestjs/mapped-types).
export class ActualizarMascotaDto {
  @ApiPropertyOptional({ example: 'Firulais', maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @Length(1, 80, { message: 'El nombre debe tener entre 1 y 80 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ enum: ['perro', 'gato', 'otro'] })
  @IsOptional()
  @IsIn(['perro', 'gato', 'otro'], { message: 'La especie debe ser una de: perro, gato, otro' })
  especie?: 'perro' | 'gato' | 'otro';

  @ApiPropertyOptional({ enum: ['pequeno', 'mediano', 'grande'] })
  @IsOptional()
  @IsIn(['pequeno', 'mediano', 'grande'], { message: 'El tamaño debe ser uno de: pequeno, mediano, grande' })
  tamano?: 'pequeno' | 'mediano' | 'grande';

  @ApiPropertyOptional({ example: 24, minimum: 0, maximum: 400 })
  @IsOptional()
  @IsInt({ message: 'edadMeses debe ser un número entero' })
  @Min(0, { message: 'edadMeses no puede ser negativa' })
  @Max(400, { message: 'edadMeses no puede ser mayor que 400' })
  edadMeses?: number;

  @ApiPropertyOptional({ enum: ['macho', 'hembra', 'desconocido'] })
  @IsOptional()
  @IsIn(['macho', 'hembra', 'desconocido'], { message: 'El sexo debe ser uno de: macho, hembra, desconocido' })
  sexo?: 'macho' | 'hembra' | 'desconocido';

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser un texto' })
  @IsNotEmpty({ message: 'La ciudad no puede estar vacía' })
  ciudad?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @Length(0, 1000, { message: 'La descripción no puede superar los 1000 caracteres' })
  descripcion?: string;
}
