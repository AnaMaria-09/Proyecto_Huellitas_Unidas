import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

export class BuscarMascotasDto extends PaginacionDto {
  @ApiPropertyOptional({ enum: ['perro', 'gato', 'otro'] })
  @IsOptional()
  @IsIn(['perro', 'gato', 'otro'], { message: 'La especie debe ser una de: perro, gato, otro' })
  especie?: 'perro' | 'gato' | 'otro';

  @ApiPropertyOptional({ enum: ['pequeno', 'mediano', 'grande'] })
  @IsOptional()
  @IsIn(['pequeno', 'mediano', 'grande'], { message: 'El tamaño debe ser uno de: pequeno, mediano, grande' })
  tamano?: 'pequeno' | 'mediano' | 'grande';

  @ApiPropertyOptional({ enum: ['macho', 'hembra', 'desconocido'] })
  @IsOptional()
  @IsIn(['macho', 'hembra', 'desconocido'], { message: 'El sexo debe ser uno de: macho, hembra, desconocido' })
  sexo?: 'macho' | 'hembra' | 'desconocido';

  @ApiPropertyOptional({ example: 'medellín', description: 'Sin distinguir mayúsculas' })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser un texto' })
  ciudad?: string;

  @ApiPropertyOptional({ example: 6, minimum: 0, maximum: 400 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'edadMinMeses debe ser un número entero' })
  @Min(0, { message: 'edadMinMeses no puede ser negativa' })
  @Max(400, { message: 'edadMinMeses no puede ser mayor que 400' })
  edadMinMeses?: number;

  @ApiPropertyOptional({ example: 36, minimum: 0, maximum: 400 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'edadMaxMeses debe ser un número entero' })
  @Min(0, { message: 'edadMaxMeses no puede ser negativa' })
  @Max(400, { message: 'edadMaxMeses no puede ser mayor que 400' })
  edadMaxMeses?: number;
}
