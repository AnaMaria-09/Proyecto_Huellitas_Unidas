import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

// GET /salud: lo consultan Docker y los balanceadores con frecuencia, por eso no cuenta para el límite.
// Responde 200 si la base de datos responde y 503 si no.
@ApiTags('salud')
@SkipThrottle()
@Controller('salud')
export class SaludController {
  constructor(
    private readonly salud: HealthCheckService,
    private readonly baseDeDatos: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  revisar(): Promise<HealthCheckResult> {
    return this.salud.check([() => this.baseDeDatos.pingCheck('baseDeDatos')]);
  }
}
