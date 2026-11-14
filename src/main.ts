import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import type { VariablesEntorno } from './config/env.model';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const config = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
bootstrap();
