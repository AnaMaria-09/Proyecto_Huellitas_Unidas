import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class IniciarSesionDto {
  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secreta123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
