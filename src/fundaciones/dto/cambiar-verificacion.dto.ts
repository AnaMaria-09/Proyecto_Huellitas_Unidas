import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarVerificacionDto {
  @ApiProperty({ example: true })
  @IsBoolean({ message: 'verificada debe ser true o false' })
  verificada: boolean;
}
