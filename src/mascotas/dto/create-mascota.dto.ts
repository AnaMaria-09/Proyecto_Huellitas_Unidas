import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateMascotaDto {
  @ApiProperty({ example: 'Firulais', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  nombre: string;

  @ApiProperty({ enum: ['perro', 'gato', 'otro'] })
  @IsIn(['perro', 'gato', 'otro'])
  especie: 'perro' | 'gato' | 'otro';

  @ApiProperty({ enum: ['pequeno', 'mediano', 'grande'] })
  @IsIn(['pequeno', 'mediano', 'grande'])
  tamano: 'pequeno' | 'mediano' | 'grande';

  @ApiProperty({ example: 24, minimum: 0, maximum: 400 })
  @IsInt()
  @Min(0)
  @Max(400)
  edadMeses: number;

  @ApiProperty({ enum: ['macho', 'hembra', 'desconocido'] })
  @IsIn(['macho', 'hembra', 'desconocido'])
  sexo: 'macho' | 'hembra' | 'desconocido';

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @ApiPropertyOptional({ example: 'Juguetón y vacunado', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descripcion?: string;
}
