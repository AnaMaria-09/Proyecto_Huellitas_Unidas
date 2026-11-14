import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarVerificacionDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  verificada: boolean;
}
