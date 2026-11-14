import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class ActualizarPerfilDto {
  @ApiPropertyOptional({ example: 'Ana María Ruiz', minLength: 2, maxLength: 80 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  nombre?: string;

  @ApiPropertyOptional({ example: 'ana.maria@correo.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
