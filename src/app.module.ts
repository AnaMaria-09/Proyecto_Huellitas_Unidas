import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { opcionesConfiguracion } from './config/configuracion';
import type { VariablesEntorno } from './config/env.model';
import { DatabaseModule } from './database/database.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FundacionesModule } from './fundaciones/fundaciones.module';
import { MascotasModule } from './mascotas/mascotas.module';
import { ArchivosModule } from './archivos/archivos.module';
import { AdopcionesModule } from './adopciones/adopciones.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot(opcionesConfiguracion),
    DatabaseModule,
    // Límite global por IP: 100 peticiones por minuto. Las rutas sensibles lo bajan con @Throttle.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      errorMessage: 'Demasiadas solicitudes. Intenta de nuevo en un minuto',
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // Solo se registra si OBSERVE_APP_KEY y OBSERVE_APP_SECRET están definidas.
    ConditionalModule.registerWhen(
      ObserveModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService<VariablesEntorno, true>) => ({
          appKey: config.get('OBSERVE_APP_KEY', { infer: true }) ?? '',
          appSecret: config.get('OBSERVE_APP_SECRET', { infer: true }) ?? '',
          serviceId: 'huellitas-unidas-nestjs',
        }),
      }),
      (env) => Boolean(env.OBSERVE_APP_KEY && env.OBSERVE_APP_SECRET),
    ),
    MascotasModule,
    AutenticacionModule,
    UsuariosModule,
    FundacionesModule,
    ArchivosModule,
    AdopcionesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
