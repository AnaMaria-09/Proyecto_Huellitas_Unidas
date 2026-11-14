import os from 'node:os';
import { Test } from '@nestjs/testing';
import { AlmacenamientoLocal } from './almacenamiento/almacenamiento-local';
import type { ProveedorAlmacenamiento } from './almacenamiento/proveedor-almacenamiento.interface';
import { OPCIONES_ALMACENAMIENTO, PROVEEDOR_ALMACENAMIENTO } from './almacenamiento/tokens';
import { ArchivosModule } from './archivos.module';
import { OPCIONES_URL_FIRMADA } from './url-firmada/opciones-url-firmada';
import { UrlFirmadaService } from './url-firmada/url-firmada.service';
import { ValidadorArchivos } from './validacion/validador-archivos';

describe('ArchivosModule', () => {
  it('resuelve los providers a través de sus tokens', async () => {
    const modulo = await Test.createTestingModule({ imports: [ArchivosModule] })
      .overrideProvider(OPCIONES_ALMACENAMIENTO)
      .useValue({ directorio: os.tmpdir() })
      .overrideProvider(OPCIONES_URL_FIRMADA)
      .useValue({ secreto: 'secreto-de-prueba-solo-para-tests-unitarios', expiraSegundos: 60 })
      .compile();

    expect(modulo.get<ProveedorAlmacenamiento>(PROVEEDOR_ALMACENAMIENTO)).toBeInstanceOf(AlmacenamientoLocal);
    expect(modulo.get(ValidadorArchivos)).toBeInstanceOf(ValidadorArchivos);
    expect(modulo.get(UrlFirmadaService)).toBeInstanceOf(UrlFirmadaService);
  });
});
