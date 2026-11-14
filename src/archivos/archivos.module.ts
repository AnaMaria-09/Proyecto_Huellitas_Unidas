import { Module } from '@nestjs/common';
import { AlmacenamientoLocal } from './almacenamiento/almacenamiento-local';
import type { OpcionesAlmacenamiento } from './almacenamiento/opciones-almacenamiento.interface';
import { OPCIONES_ALMACENAMIENTO, PROVEEDOR_ALMACENAMIENTO } from './almacenamiento/tokens';
import type { OpcionesUrlFirmada } from './url-firmada/opciones-url-firmada';
import { OPCIONES_URL_FIRMADA } from './url-firmada/opciones-url-firmada';
import { UrlFirmadaService } from './url-firmada/url-firmada.service';
import { REGLAS_ARCHIVOS, REGLAS_VALIDACION_ARCHIVOS } from './validacion/reglas-archivos';
import { ValidadorArchivos } from './validacion/validador-archivos';

const EXPIRA_SEGUNDOS_POR_DEFECTO = 300;

// Todavía no se registra en app.module: el controller, la entidad Archivo y el
// registro llegan cuando TypeORM y la configuración estén en main.
@Module({
  providers: [
    {
      provide: OPCIONES_ALMACENAMIENTO,
      // TODO: leer ALMACENAMIENTO_DIR desde ConfigService cuando @nestjs/config esté en main.
      useFactory: (): OpcionesAlmacenamiento => ({
        directorio: process.env.ALMACENAMIENTO_DIR ?? 'uploads',
      }),
    },
    { provide: PROVEEDOR_ALMACENAMIENTO, useClass: AlmacenamientoLocal },
    { provide: REGLAS_VALIDACION_ARCHIVOS, useValue: REGLAS_ARCHIVOS },
    ValidadorArchivos,
    {
      provide: OPCIONES_URL_FIRMADA,
      // TODO: leer URL_FIRMADA_SECRETO y URL_FIRMADA_EXPIRA_SEGUNDOS desde ConfigService
      // cuando @nestjs/config esté en main. Sin secreto, UrlFirmadaService falla al arrancar.
      useFactory: (): OpcionesUrlFirmada => ({
        secreto: process.env.URL_FIRMADA_SECRETO ?? '',
        expiraSegundos: Number(process.env.URL_FIRMADA_EXPIRA_SEGUNDOS ?? EXPIRA_SEGUNDOS_POR_DEFECTO),
      }),
    },
    UrlFirmadaService,
  ],
  exports: [PROVEEDOR_ALMACENAMIENTO, ValidadorArchivos, UrlFirmadaService],
})
export class ArchivosModule {}
