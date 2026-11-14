import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { DistintaDe } from '../validadores/distinta-de.validator';

export class CambiarContrasenaDto {
  @ApiProperty({ example: 'secreta123' })
  @IsString()
  @IsNotEmpty()
  contrasenaActual: string;

  @ApiProperty({ example: 'nueva-secreta456', minLength: 8, maxLength: 64, description: 'Distinta de la actual' })
  @IsString()
  @Length(8, 64)
  @DistintaDe('contrasenaActual', { message: 'La contraseña nueva debe ser distinta de la actual' })
  contrasenaNueva: string;
}
