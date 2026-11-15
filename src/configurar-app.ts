import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { PREFIJO_API } from './common/prefijo-api';
import type { VariablesEntorno } from './config/env.model';

// Configuración común de la aplicación; la usan main.ts y las pruebas e2e.
export function configurarApp(app: INestApplication): void {
  const config = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);

  app.setGlobalPrefix(PREFIJO_API);
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

  // Documentación en /api/docs (fuera del prefijo /api/v1).
  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Huellitas Unidas API')
      .setDescription('API REST para la adopción de animales. Todas las rutas usan el prefijo /api/v1.')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, documento);
}
