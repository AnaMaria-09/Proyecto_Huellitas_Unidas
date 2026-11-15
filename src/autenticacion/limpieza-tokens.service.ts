import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TokenRefresco } from './entities/token-refresco.entity';

// Días que se conservan los tokens vencidos o revocados (sirven para detectar reutilización).
export const DIAS_RETENCION_TOKENS = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Tarea diaria que borra de tokens_refresco los tokens vencidos o revocados hace más de
// DIAS_RETENCION_TOKENS días. Solo corre si ScheduleModule está registrado (no con NODE_ENV=test).
@Injectable()
export class LimpiezaTokensService {
  private readonly logger = new Logger(LimpiezaTokensService.name);

  constructor(
    @InjectRepository(TokenRefresco)
    private readonly tokens: Repository<TokenRefresco>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'limpieza-tokens-refresco' })
  async limpiar(ahora: Date = new Date()): Promise<number> {
    const limite = new Date(
      ahora.getTime() - DIAS_RETENCION_TOKENS * MS_POR_DIA,
    );
    const vencidos = await this.tokens.delete({ expiraEn: LessThan(limite) });
    const revocados = await this.tokens.delete({
      revocadoEn: LessThan(limite),
    });
    const borrados = (vencidos.affected ?? 0) + (revocados.affected ?? 0);
    this.logger.log(`Limpieza de tokens de refresco: ${borrados} borrados`);
    return borrados;
  }
}
