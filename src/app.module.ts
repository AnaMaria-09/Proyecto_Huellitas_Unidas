import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { UsuariosController } from './usuarios/usuarios.controller';
import { FundacionesController } from './fundaciones/fundaciones.controller';
import { AdopcionesController } from './adopciones/adopciones.controller';
import { MascotasModule } from './mascotas/mascotas.module';
import { ArchivosController } from './archivos/archivos.controller';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'huellitas-unidas-nestjs',
    }),
    MascotasModule,
    AutenticacionModule,
  ],
  controllers: [AppController, UsuariosController, FundacionesController, AdopcionesController, ArchivosController],
  providers: [AppService],
})
export class AppModule {}
