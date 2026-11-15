import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class ActualizarPerfilDto {
  @ApiPropertyOptional({ example: 'Ana María Ruiz', minLength: 2, maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @Length(2, 80, { message: 'El nombre debe tener entre 2 y 80 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'ana.maria@correo.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;
}
