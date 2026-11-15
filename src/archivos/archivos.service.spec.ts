import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Mocked } from 'jest-mock';
import type { Repository } from 'typeorm';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { Mascota } from '../mascotas/entities/mascota.entity';
import type { EstadoMascota } from '../mascotas/mascota.model';
import { MascotasService } from '../mascotas/mascotas.service';
import { PROVEEDOR_ALMACENAMIENTO } from './almacenamiento/tokens';
import { ArchivosService } from './archivos.service';
import type { ArchivoConUrl, ArchivoSubido } from './archivos.service';
import { Archivo } from './entities/archivo.entity';
import { AlmacenamientoFake } from './testing/almacenamiento.fake';
import { OPCIONES_URL_FIRMADA } from './url-firmada/opciones-url-firmada';
import { UrlFirmadaService } from './url-firmada/url-firmada.service';
import { REGLAS_ARCHIVOS, REGLAS_VALIDACION_ARCHIVOS } from './validacion/reglas-archivos';
import { ValidadorArchivos } from './validacion/validador-archivos';

const FUNDACION: PayloadJwt = { sub: 1, rol: 'fundacion', email: 'fundacion@test.com' };
const OTRA_FUNDACION: PayloadJwt = { sub: 2, rol: 'fundacion', email: 'otra@test.com' };
const CIUDADANO: PayloadJwt = { sub: 3, rol: 'ciudadano', email: 'ciudadano@test.com' };
const ADMIN: PayloadJwt = { sub: 9, rol: 'administrador', email: 'admin@test.com' };
const MASCOTA_ID = 10;

const CABECERA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function png(nombre = 'foto.png'): ArchivoSubido {
  return { buffer: Buffer.from([...CABECERA_PNG, 1, 2, 3, 4]), mimetype: 'image/png', originalname: nombre };
}

function pdf(): ArchivoSubido {
  return { buffer: Buffer.from('%PDF-1.7 contenido'), mimetype: 'application/pdf', originalname: 'cedula.pdf' };
}

function mascota(estado: EstadoMascota = 'disponible', fundacionId = FUNDACION.sub): Mascota {
  return Object.assign(new Mascota(), { id: MASCOTA_ID, fundacionId, estado });
}

// Repositorio en memoria con lo que usa ArchivosService.
function crearRepositorioArchivos() {
  const filas = new Map<number, Archivo>();
  let siguienteId = 1;
  const repositorio = {
    filas,
    create: jest.fn((datos: Partial<Archivo>) => Object.assign(new Archivo(), datos)),
    save: jest.fn(async (archivos: Archivo[]) => {
      for (const archivo of archivos) {
        archivo.id ??= siguienteId++;
        filas.set(archivo.id, archivo);
      }
      return archivos;
    }),
    findOneBy: jest.fn(async ({ id }: { id: number }) => filas.get(id) ?? null),
    find: jest.fn(async () => [...filas.values()]),
    remove: jest.fn(async (archivo: Archivo) => {
      filas.delete(archivo.id);
      return archivo;
    }),
  };
  return repositorio;
}

describe('ArchivosService', () => {
  let servicio: ArchivosService;
  let almacenamiento: AlmacenamientoFake;
  let repositorio: ReturnType<typeof crearRepositorioArchivos>;
  let mascotas: Mocked<Pick<MascotasService, 'obtenerPorId'>>;

  beforeEach(async () => {
    almacenamiento = new AlmacenamientoFake();
    repositorio = crearRepositorioArchivos();
    mascotas = { obtenerPorId: jest.fn<MascotasService['obtenerPorId']>().mockResolvedValue(mascota()) };

    const modulo = await Test.createTestingModule({
      providers: [
        ArchivosService,
        ValidadorArchivos,
        UrlFirmadaService,
        { provide: REGLAS_VALIDACION_ARCHIVOS, useValue: REGLAS_ARCHIVOS },
        { provide: OPCIONES_URL_FIRMADA, useValue: { secreto: 'secreto-de-prueba-solo-para-tests-unitarios', expiraSegundos: 60 } },
        { provide: PROVEEDOR_ALMACENAMIENTO, useValue: almacenamiento },
        { provide: getRepositoryToken(Archivo), useValue: repositorio as unknown as Repository<Archivo> },
        { provide: MascotasService, useValue: mascotas },
      ],
    }).compile();
    servicio = modulo.get(ArchivosService);
  });

  async function subirUna(): Promise<ArchivoConUrl> {
    const [archivo] = await servicio.subirImagenes(FUNDACION, MASCOTA_ID, [png()]);
    return archivo;
  }

  describe('subirImagenes', () => {
    it('guarda los archivos físicos y las filas, y devuelve cada uno con su url firmada', async () => {
      const resultado = await servicio.subirImagenes(FUNDACION, MASCOTA_ID, [png('a.png'), png('b.png')]);

      expect(resultado).toHaveLength(2);
      expect(almacenamiento.archivos.size).toBe(2);
      expect(repositorio.filas.size).toBe(2);
      expect(resultado[0]).toMatchObject({
        nombreOriginal: 'a.png',
        tipoMime: 'image/png',
        tipo: 'imagen',
        propietarioId: FUNDACION.sub,
        mascotaId: MASCOTA_ID,
      });
      expect(resultado[0].url).toMatch(/^\/api\/v1\/archivos\/descargar\/1\?expira=\d+&firma=/);
      expect(almacenamiento.archivos.has(resultado[1].clave)).toBe(true);
    });

    it('lanza 403 si la mascota es de otra fundación y no guarda nada', async () => {
      await expect(servicio.subirImagenes(OTRA_FUNDACION, MASCOTA_ID, [png()])).rejects.toThrow(ForbiddenException);
      expect(almacenamiento.archivos.size).toBe(0);
      expect(repositorio.save).not.toHaveBeenCalled();
    });

    it('si un archivo es inválido no guarda ninguno', async () => {
      const falso: ArchivoSubido = { ...pdf(), mimetype: 'image/png', originalname: 'falso.png' };

      await expect(servicio.subirImagenes(FUNDACION, MASCOTA_ID, [png(), falso, png()])).rejects.toThrow(
        BadRequestException,
      );
      expect(almacenamiento.archivos.size).toBe(0);
      expect(repositorio.save).not.toHaveBeenCalled();
    });

    it('elimina los archivos físicos si falla el guardado en la base', async () => {
      repositorio.save.mockRejectedValueOnce(new Error('se cayó la base'));

      await expect(servicio.subirImagenes(FUNDACION, MASCOTA_ID, [png(), png()])).rejects.toThrow('se cayó la base');
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('rechaza una petición sin imágenes', async () => {
      await expect(servicio.subirImagenes(FUNDACION, MASCOTA_ID, [])).rejects.toThrow(BadRequestException);
    });
  });

  describe('subirDocumento', () => {
    it('guarda un PDF como documento sin mascota', async () => {
      const documento = await servicio.subirDocumento(CIUDADANO, pdf());

      expect(documento).toMatchObject({ tipo: 'documento', mascotaId: null, propietarioId: CIUDADANO.sub });
    });

    it('rechaza una imagen enviada como documento', async () => {
      await expect(servicio.subirDocumento(CIUDADANO, png())).rejects.toThrow(BadRequestException);
    });

    it('exige un archivo', async () => {
      await expect(servicio.subirDocumento(CIUDADANO, undefined)).rejects.toThrow(BadRequestException);
    });
  });

  describe('obtenerUrlFirmada', () => {
    it('la da a cualquier usuario si es una imagen de una mascota disponible', async () => {
      const archivo = await subirUna();

      await expect(servicio.obtenerUrlFirmada(archivo.id, CIUDADANO)).resolves.toHaveProperty('url');
    });

    it('responde 404 a un tercero si la mascota no está disponible', async () => {
      const archivo = await subirUna();
      mascotas.obtenerPorId.mockResolvedValue(mascota('en_proceso'));

      await expect(servicio.obtenerUrlFirmada(archivo.id, CIUDADANO)).rejects.toThrow(NotFoundException);
    });

    it('la da al propietario y al administrador aunque la mascota no esté disponible', async () => {
      const archivo = await subirUna();
      mascotas.obtenerPorId.mockResolvedValue(mascota('adoptada'));

      await expect(servicio.obtenerUrlFirmada(archivo.id, FUNDACION)).resolves.toHaveProperty('expiraEn');
      await expect(servicio.obtenerUrlFirmada(archivo.id, ADMIN)).resolves.toHaveProperty('expiraEn');
    });

    it('no da la url de un documento ajeno', async () => {
      const documento = await servicio.subirDocumento(CIUDADANO, pdf());

      await expect(servicio.obtenerUrlFirmada(documento.id, FUNDACION)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listarImagenesDeMascota', () => {
    it('responde 404 a un tercero si la mascota no está disponible', async () => {
      mascotas.obtenerPorId.mockResolvedValue(mascota('adoptada'));

      await expect(servicio.listarImagenesDeMascota(MASCOTA_ID, CIUDADANO)).rejects.toThrow(NotFoundException);
      await expect(servicio.listarImagenesDeMascota(MASCOTA_ID)).rejects.toThrow(NotFoundException);
    });

    it('lista las imágenes de una mascota disponible sin sesión', async () => {
      await subirUna();

      await expect(servicio.listarImagenesDeMascota(MASCOTA_ID)).resolves.toHaveLength(1);
    });
  });

  describe('descargar', () => {
    it('devuelve el contenido con una firma válida', async () => {
      const archivo = await subirUna();
      const parametros = new URL(archivo.url, 'http://localhost').searchParams;

      const descarga = await servicio.descargar(
        archivo.id,
        Number(parametros.get('expira')),
        parametros.get('firma') ?? '',
      );

      expect(descarga.tipoMime).toBe('image/png');
    });

    it('responde 403 con una firma alterada', async () => {
      const archivo = await subirUna();

      await expect(servicio.descargar(archivo.id, Math.floor(Date.now() / 1000) + 60, 'firma-falsa')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('eliminar', () => {
    it('responde 403 si quien borra no es el dueño ni administrador', async () => {
      const archivo = await subirUna();

      await expect(servicio.eliminar(archivo.id, OTRA_FUNDACION)).rejects.toThrow(ForbiddenException);
      expect(repositorio.filas.size).toBe(1);
      expect(almacenamiento.archivos.size).toBe(1);
    });

    it('borra la fila y luego el archivo físico', async () => {
      const archivo = await subirUna();

      await servicio.eliminar(archivo.id, FUNDACION);

      expect(repositorio.filas.size).toBe(0);
      expect(almacenamiento.archivos.size).toBe(0);
    });

    it('no falla si el archivo físico ya no existe', async () => {
      const archivo = await subirUna();
      almacenamiento.archivos.clear();

      await expect(servicio.eliminar(archivo.id, ADMIN)).resolves.toBeUndefined();
      expect(repositorio.filas.size).toBe(0);
    });

    it('responde 404 si el archivo no existe', async () => {
      await expect(servicio.eliminar(999, ADMIN)).rejects.toThrow(NotFoundException);
    });
  });
});
