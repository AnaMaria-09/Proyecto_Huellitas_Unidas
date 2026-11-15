import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import type { VariablesEntorno } from '../config/env.model';
import { MascotasModule } from '../mascotas/mascotas.module';
import { AlmacenamientoLocal } from './almacenamiento/almacenamiento-local';
import type { OpcionesAlmacenamiento } from './almacenamiento/opciones-almacenamiento.interface';
import { OPCIONES_ALMACENAMIENTO, PROVEEDOR_ALMACENAMIENTO } from './almacenamiento/tokens';
import { ArchivosController } from './archivos.controller';
import { ArchivosService } from './archivos.service';
import { Archivo } from './entities/archivo.entity';
import { MascotaEliminadaListener } from './listeners/mascota-eliminada.listener';
import type { OpcionesUrlFirmada } from './url-firmada/opciones-url-firmada';
import { OPCIONES_URL_FIRMADA } from './url-firmada/opciones-url-firmada';
import { UrlFirmadaService } from './url-firmada/url-firmada.service';
import { REGLAS_ARCHIVOS, REGLAS_VALIDACION_ARCHIVOS } from './validacion/reglas-archivos';
import { ValidadorArchivos } from './validacion/validador-archivos';

@Module({
  // AutenticacionModule aporta los guards; MascotasModule, MascotasService para validar dueño y estado.
  imports: [TypeOrmModule.forFeature([Archivo]), AutenticacionModule, MascotasModule],
  controllers: [ArchivosController],
  providers: [
    ArchivosService,
    {
      provide: OPCIONES_ALMACENAMIENTO,
      inject: [ConfigService],
      useFactory: (config: ConfigService<VariablesEntorno, true>): OpcionesAlmacenamiento => ({
        directorio: config.get('ALMACENAMIENTO_DIR', { infer: true }),
      }),
    },
    { provide: PROVEEDOR_ALMACENAMIENTO, useClass: AlmacenamientoLocal },
    { provide: REGLAS_VALIDACION_ARCHIVOS, useValue: REGLAS_ARCHIVOS },
    ValidadorArchivos,
    {
      provide: OPCIONES_URL_FIRMADA,
      inject: [ConfigService],
      useFactory: (config: ConfigService<VariablesEntorno, true>): OpcionesUrlFirmada => ({
        secreto: config.get('URL_FIRMADA_SECRETO', { infer: true }),
        expiraSegundos: config.get('URL_FIRMADA_EXPIRA_SEGUNDOS', { infer: true }),
      }),
    },
    UrlFirmadaService,
    MascotaEliminadaListener,
  ],
  exports: [ArchivosService, PROVEEDOR_ALMACENAMIENTO, ValidadorArchivos, UrlFirmadaService],
})
export class ArchivosModule {}
