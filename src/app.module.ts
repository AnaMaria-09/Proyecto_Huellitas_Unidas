import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutenticacionController } from './autenticacion/autenticacion.controller';
import { UsuariosController } from './usuarios/usuarios.controller';
import { FundacionesController } from './fundaciones/fundaciones.controller';
import { AdopcionesController } from './adopciones/adopciones.controller';
import { MascotasController } from './mascotas/mascotas.controller';
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
  ],
  controllers: [AppController, AutenticacionController, UsuariosController, FundacionesController, AdopcionesController, MascotasController, ArchivosController],
  providers: [AppService],
})
export class AppModule {}
