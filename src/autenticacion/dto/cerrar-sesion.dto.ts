import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CerrarSesionDto {
  @ApiProperty({ description: 'Refresh token de la sesión que se cierra' })
  @IsString({ message: 'El refresh token debe ser un texto' })
  @IsNotEmpty({ message: 'El refresh token es obligatorio' })
  @MaxLength(200, { message: 'El refresh token no puede superar los 200 caracteres' })
  refreshToken: string;
}
