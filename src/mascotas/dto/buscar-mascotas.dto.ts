import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BuscarMascotasDto {
  @IsOptional()
  @IsIn(['perro', 'gato', 'otro'])
  especie?: 'perro' | 'gato' | 'otro';

  @IsOptional()
  @IsIn(['pequeno', 'mediano', 'grande'])
  tamano?: 'pequeno' | 'mediano' | 'grande';

  @IsOptional()
  @IsIn(['macho', 'hembra', 'desconocido'])
  sexo?: 'macho' | 'hembra' | 'desconocido';

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(400)
  edadMinMeses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(400)
  edadMaxMeses?: number;
}
