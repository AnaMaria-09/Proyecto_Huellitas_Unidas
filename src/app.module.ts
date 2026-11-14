import { Module } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { opcionesConfiguracion } from './config/configuracion';
import type { VariablesEntorno } from './config/env.model';
import { DatabaseModule } from './database/database.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FundacionesModule } from './fundaciones/fundaciones.module';
import { AdopcionesController } from './adopciones/adopciones.controller';
import { MascotasModule } from './mascotas/mascotas.module';
import { ArchivosController } from './archivos/archivos.controller';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot(opcionesConfiguracion),
    DatabaseModule,
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
  ],
  controllers: [AppController, AdopcionesController, ArchivosController],
  providers: [AppService],
})
export class AppModule {}
