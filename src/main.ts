import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import type { VariablesEntorno } from './config/env.model';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  configurarApp(app);

  const config = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
bootstrap();
