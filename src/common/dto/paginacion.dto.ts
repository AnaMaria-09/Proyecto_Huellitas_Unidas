import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const LIMITE_POR_DEFECTO = 20;
export const LIMITE_MAXIMO = 100;

// Query params ?pagina=&limite= de los listados. Los valores por defecto se aplican
// porque el ValidationPipe global usa transform: true.
export class PaginacionDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina debe ser un número entero' })
  @Min(1, { message: 'pagina debe ser mayor o igual a 1' })
  pagina: number = 1;

  @ApiPropertyOptional({ default: LIMITE_POR_DEFECTO, minimum: 1, maximum: LIMITE_MAXIMO })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limite debe ser un número entero' })
  @Min(1, { message: 'limite debe ser mayor o igual a 1' })
  @Max(LIMITE_MAXIMO, { message: `limite no puede ser mayor que ${LIMITE_MAXIMO}` })
  limite: number = LIMITE_POR_DEFECTO;
}
