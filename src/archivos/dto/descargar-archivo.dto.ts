import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Query ?expira=&firma= de una URL firmada.
export class DescargarArchivoDto {
  @ApiProperty({ example: 1794700000, description: 'Fecha de expiración en segundos desde 1970 (UTC)' })
  @Type(() => Number)
  @IsInt({ message: 'expira debe ser un número entero' })
  expira: number;

  @ApiProperty({ description: 'Firma HMAC-SHA256 en base64url' })
  @IsString({ message: 'firma debe ser un texto' })
  @IsNotEmpty({ message: 'firma no puede estar vacía' })
  @MaxLength(128, { message: 'firma no puede superar los 128 caracteres' })
  firma: string;
}
