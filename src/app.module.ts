import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { sinLimiteAutenticacion, THROTTLER_AUTENTICACION } from './common/limite-autenticacion';
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
    // Eventos entre módulos sin depender unos de otros (p. ej. mascota.eliminada → archivos).
    EventEmitterModule.forRoot(),
    // Límites por IP y por minuto: uno global y otro, más bajo, solo para las rutas con
    // @LimiteAutenticacion (registro e inicio de sesión). Los valores vienen de .env.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<VariablesEntorno, true>) => ({
        throttlers: [
          { ttl: 60_000, limit: config.get('LIMITE_PETICIONES_POR_MINUTO', { infer: true }) },
          {
            name: THROTTLER_AUTENTICACION,
            ttl: 60_000,
            limit: config.get('LIMITE_AUTENTICACION_POR_MINUTO', { infer: true }),
            skipIf: sinLimiteAutenticacion,
          },
        ],
        errorMessage: 'Demasiadas solicitudes. Intenta de nuevo en un minuto',
      }),
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
