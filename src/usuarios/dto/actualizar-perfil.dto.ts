import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
