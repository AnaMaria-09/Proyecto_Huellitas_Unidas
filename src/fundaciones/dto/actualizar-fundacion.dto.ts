import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

// No incluye 'verificada': solo un administrador la cambia, por /fundaciones/:id/verificacion.
export class ActualizarFundacionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  nombreOrganizacion?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 -]{7,20}$/, { message: 'telefono debe tener entre 7 y 20 dígitos' })
  telefono?: string;
}
