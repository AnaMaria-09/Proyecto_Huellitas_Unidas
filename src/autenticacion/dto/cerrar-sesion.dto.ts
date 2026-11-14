import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CerrarSesionDto {
  @ApiProperty({ description: 'Refresh token de la sesión que se cierra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
