import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateMascotaDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  nombre: string;

  @IsIn(['perro', 'gato', 'otro'])
  especie: 'perro' | 'gato' | 'otro';

  @IsIn(['pequeno', 'mediano', 'grande'])
  tamano: 'pequeno' | 'mediano' | 'grande';

  @IsInt()
  @Min(0)
  @Max(400)
  edadMeses: number;

  @IsIn(['macho', 'hembra', 'desconocido'])
  sexo: 'macho' | 'hembra' | 'desconocido';

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descripcion?: string;
}
