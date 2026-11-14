import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefrescarTokenDto {
  @ApiProperty({ description: 'Refresh token recibido en iniciar_sesion o en el último refrescar_token' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
