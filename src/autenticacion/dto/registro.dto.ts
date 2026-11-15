import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegistroDto {
  @ApiProperty({ example: 'Ana Ruiz', minLength: 2, maxLength: 80 })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(2, 80, { message: 'El nombre debe tener entre 2 y 80 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({ example: 'secreta123', minLength: 8, maxLength: 64 })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @Length(8, 64, { message: 'La contraseña debe tener entre 8 y 64 caracteres' })
  password: string;

  @ApiProperty({ enum: ['ciudadano', 'fundacion'], description: 'El registro público no permite administrador' })
  // 'administrador' nunca se permite en el registro público.
  @IsIn(['ciudadano', 'fundacion'], { message: "El rol debe ser 'ciudadano' o 'fundacion'" })
  rol: 'ciudadano' | 'fundacion';
}
