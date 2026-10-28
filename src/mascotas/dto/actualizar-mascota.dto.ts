import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

// Mismos campos que CreateMascotaDto, todos opcionales (sin instalar @nestjs/mapped-types).
export class ActualizarMascotaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  nombre?: string;

  @IsOptional()
  @IsIn(['perro', 'gato', 'otro'])
  especie?: 'perro' | 'gato' | 'otro';

  @IsOptional()
  @IsIn(['pequeno', 'mediano', 'grande'])
  tamano?: 'pequeno' | 'mediano' | 'grande';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  edadMeses?: number;

  @IsOptional()
  @IsIn(['macho', 'hembra', 'desconocido'])
  sexo?: 'macho' | 'hembra' | 'desconocido';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ciudad?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descripcion?: string;
}
