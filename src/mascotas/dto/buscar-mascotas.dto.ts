import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

export class BuscarMascotasDto extends PaginacionDto {
  @ApiPropertyOptional({ enum: ['perro', 'gato', 'otro'] })
  @IsOptional()
  @IsIn(['perro', 'gato', 'otro'])
  especie?: 'perro' | 'gato' | 'otro';

  @ApiPropertyOptional({ enum: ['pequeno', 'mediano', 'grande'] })
  @IsOptional()
  @IsIn(['pequeno', 'mediano', 'grande'])
  tamano?: 'pequeno' | 'mediano' | 'grande';

  @ApiPropertyOptional({ enum: ['macho', 'hembra', 'desconocido'] })
  @IsOptional()
  @IsIn(['macho', 'hembra', 'desconocido'])
  sexo?: 'macho' | 'hembra' | 'desconocido';

  @ApiPropertyOptional({ example: 'medellín', description: 'Sin distinguir mayúsculas' })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ example: 6, minimum: 0, maximum: 400 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(400)
  edadMinMeses?: number;

  @ApiPropertyOptional({ example: 36, minimum: 0, maximum: 400 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(400)
  edadMaxMeses?: number;
}
