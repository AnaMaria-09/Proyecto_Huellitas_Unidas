import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { MascotasModule } from '../mascotas/mascotas.module';
import { AdopcionesController } from './adopciones.controller';
import { AdopcionesService } from './adopciones.service';
import { HistorialSolicitud } from './entities/historial-solicitud.entity';
import { SolicitudAdopcion } from './entities/solicitud-adopcion.entity';
import { HistorialSolicitudesService } from './historial-solicitudes.service';

@Module({
  // AutenticacionModule aporta los guards; MascotasModule, MascotasService para cambiar el
  // estado de la mascota dentro de la misma transacción.
  imports: [
    TypeOrmModule.forFeature([SolicitudAdopcion, HistorialSolicitud]),
    AutenticacionModule,
    MascotasModule,
  ],
  controllers: [AdopcionesController],
  providers: [AdopcionesService, HistorialSolicitudesService],
})
export class AdopcionesModule {}
