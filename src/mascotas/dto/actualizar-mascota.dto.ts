import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

// Mismos campos que CreateMascotaDto, todos opcionales (sin instalar @nestjs/mapped-types).
export class ActualizarMascotaDto {
  @ApiPropertyOptional({ example: 'Firulais', maxLength: 80 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  nombre?: string;

  @ApiPropertyOptional({ enum: ['perro', 'gato', 'otro'] })
  @IsOptional()
  @IsIn(['perro', 'gato', 'otro'])
  especie?: 'perro' | 'gato' | 'otro';

  @ApiPropertyOptional({ enum: ['pequeno', 'mediano', 'grande'] })
  @IsOptional()
  @IsIn(['pequeno', 'mediano', 'grande'])
  tamano?: 'pequeno' | 'mediano' | 'grande';

  @ApiPropertyOptional({ example: 24, minimum: 0, maximum: 400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  edadMeses?: number;

  @ApiPropertyOptional({ enum: ['macho', 'hembra', 'desconocido'] })
  @IsOptional()
  @IsIn(['macho', 'hembra', 'desconocido'])
  sexo?: 'macho' | 'hembra' | 'desconocido';

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ciudad?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descripcion?: string;
}
