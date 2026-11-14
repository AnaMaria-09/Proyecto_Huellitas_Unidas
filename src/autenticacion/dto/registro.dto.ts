import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegistroDto {
  @ApiProperty({ example: 'Ana Ruiz', minLength: 2, maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secreta123', minLength: 8, maxLength: 64 })
  @IsString()
  @Length(8, 64)
  password: string;

  @ApiProperty({ enum: ['ciudadano', 'fundacion'], description: 'El registro público no permite administrador' })
  // 'administrador' nunca se permite en el registro público.
  @IsIn(['ciudadano', 'fundacion'])
  rol: 'ciudadano' | 'fundacion';
}
