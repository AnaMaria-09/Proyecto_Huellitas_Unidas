import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CerrarSesionDto {
  // El refresh token de la sesión que se cierra.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
