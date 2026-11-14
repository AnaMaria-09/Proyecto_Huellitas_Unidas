import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule, ObserveInstrument } from './app.module';
import type { VariablesEntorno } from './config/env.model';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const config = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origen) => origen.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Cierra las conexiones (TypeORM) al recibir SIGTERM, por ejemplo con docker compose down.
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}
bootstrap();
