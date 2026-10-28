import { IsEmail, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegistroDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 64)
  password: string;

  // 'administrador' nunca se permite en el registro público.
  @IsIn(['ciudadano', 'fundacion'])
  rol: 'ciudadano' | 'fundacion';
}
