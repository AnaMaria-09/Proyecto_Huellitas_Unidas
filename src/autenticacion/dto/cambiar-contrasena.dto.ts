import { IsNotEmpty, IsString, Length } from 'class-validator';
import { DistintaDe } from '../validadores/distinta-de.validator';

export class CambiarContrasenaDto {
  @IsString()
  @IsNotEmpty()
  contrasenaActual: string;

  @IsString()
  @Length(8, 64)
  @DistintaDe('contrasenaActual', { message: 'La contraseña nueva debe ser distinta de la actual' })
  contrasenaNueva: string;
}
