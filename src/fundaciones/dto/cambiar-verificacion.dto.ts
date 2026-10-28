import { IsBoolean } from 'class-validator';

export class CambiarVerificacionDto {
  @IsBoolean()
  verificada: boolean;
}
