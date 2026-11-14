import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

// No incluye 'verificada': solo un administrador la cambia, por /fundaciones/:id/verificacion.
export class ActualizarFundacionDto {
  @ApiPropertyOptional({ example: 'Patitas Felices', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  nombreOrganizacion?: string;

  @ApiPropertyOptional({ example: 'Medellín', minLength: 2, maxLength: 80 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  ciudad?: string;

  @ApiPropertyOptional({ example: '+57 300 1234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 -]{7,20}$/, { message: 'telefono debe tener entre 7 y 20 dígitos' })
  telefono?: string;
}
