import type { Readable } from 'node:stream';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { PREFIJO_API } from '../common/prefijo-api';
import { MascotasService } from '../mascotas/mascotas.service';
import { puedeGestionarArchivo, puedeVerImagenesDeMascota } from './acceso-archivos';
import type { ProveedorAlmacenamiento } from './almacenamiento/proveedor-almacenamiento.interface';
import { PROVEEDOR_ALMACENAMIENTO } from './almacenamiento/tokens';
import { Archivo } from './entities/archivo.entity';
import { UrlFirmadaService } from './url-firmada/url-firmada.service';
import type { CategoriaArchivo } from './validacion/reglas-archivos';
import { ValidadorArchivos } from './validacion/validador-archivos';
import type { ArchivoEntrante } from './validacion/validador-archivos';

const LONGITUD_MAXIMA_NOMBRE = 255;

// Lo que entrega multer y usa este servicio.
export interface ArchivoSubido extends ArchivoEntrante {
  originalname: string;
}

export interface UrlFirmadaArchivo {
  url: string;
  expiraEn: string;
}

export type ArchivoConUrl = Archivo & UrlFirmadaArchivo;

export interface DescargaArchivo {
  contenido: Readable;
  tipoMime: string;
  clave: string;
}

@Injectable()
export class ArchivosService {
  private readonly logger = new Logger(ArchivosService.name);

  constructor(
    @InjectRepository(Archivo) private readonly archivos: Repository<Archivo>,
    @Inject(PROVEEDOR_ALMACENAMIENTO) private readonly almacenamiento: ProveedorAlmacenamiento,
    private readonly validador: ValidadorArchivos,
    private readonly urlFirmada: UrlFirmadaService,
    private readonly mascotasService: MascotasService,
  ) {}

  async subirImagenes(usuario: PayloadJwt, mascotaId: number, imagenes: ArchivoSubido[]): Promise<ArchivoConUrl[]> {
    if (imagenes.length === 0) {
      throw new BadRequestException('Debes enviar al menos una imagen en el campo "imagenes"');
    }
    const mascota = await this.mascotasService.obtenerPorId(mascotaId);
    if (mascota.fundacionId !== usuario.sub) {
      throw new ForbiddenException('Solo la fundación dueña puede subir imágenes de esta mascota');
    }
    // Se validan todas antes de guardar cualquiera: si una falla, no se guarda ninguna.
    for (const imagen of imagenes) {
      this.validador.validar(imagen, 'imagen');
    }
    const guardadas = await this.registrar(imagenes, 'imagen', usuario.sub, mascotaId);
    return guardadas.map((archivo) => this.conUrl(archivo));
  }

  async subirDocumento(usuario: PayloadJwt, documento: ArchivoSubido | undefined): Promise<ArchivoConUrl> {
    if (!documento) {
      throw new BadRequestException('Debes enviar un archivo en el campo "documento"');
    }
    this.validador.validar(documento, 'documento');
    const [guardado] = await this.registrar([documento], 'documento', usuario.sub, null);
    return this.conUrl(guardado);
  }

  async listarImagenesDeMascota(mascotaId: number, usuario?: PayloadJwt): Promise<ArchivoConUrl[]> {
    const mascota = await this.mascotasService.obtenerPorId(mascotaId);
    if (!puedeVerImagenesDeMascota(mascota, usuario)) {
      throw new NotFoundException(`Las imágenes de la mascota ${mascotaId} no están disponibles`);
    }
    const imagenes = await this.archivos.find({ where: { mascotaId, tipo: 'imagen' }, order: { id: 'ASC' } });
    return imagenes.map((archivo) => this.conUrl(archivo));
  }

  // A quien no puede ver el archivo se le responde 404, para no revelar que existe.
  async obtenerUrlFirmada(id: number, usuario: PayloadJwt): Promise<UrlFirmadaArchivo> {
    const archivo = await this.buscar(id);
    if (!(await this.puedeVer(archivo, usuario))) {
      throw new NotFoundException(`Archivo ${id} no encontrado`);
    }
    return this.firmar(archivo);
  }

  // La firma se verifica antes de consultar la base.
  async descargar(id: number, expira: number, firma: string): Promise<DescargaArchivo> {
    if (!this.urlFirmada.verificar(id, expira, firma)) {
      throw new ForbiddenException('El enlace de descarga no es válido o ya expiró');
    }
    const archivo = await this.buscar(id);
    const contenido = await this.almacenamiento.obtener(archivo.clave);
    return { contenido, tipoMime: archivo.tipoMime, clave: archivo.clave };
  }

  // Primero se borra la fila y luego el archivo físico; si el físico ya no existe, no se falla.
  async eliminar(id: number, usuario: PayloadJwt): Promise<void> {
    const archivo = await this.buscar(id);
    if (!puedeGestionarArchivo(archivo, usuario)) {
      throw new ForbiddenException('Solo quien subió el archivo o un administrador puede eliminarlo');
    }
    const { clave } = archivo;
    await this.archivos.remove(archivo);
    await this.eliminarFisico(clave);
  }

  // Guarda primero los archivos físicos y luego las filas (save de varias entidades es una transacción).
  // Si algo falla, borra los físicos ya guardados para no dejar huérfanos.
  private async registrar(
    subidos: ArchivoSubido[],
    tipo: CategoriaArchivo,
    propietarioId: number,
    mascotaId: number | null,
  ): Promise<Archivo[]> {
    const claves: string[] = [];
    try {
      for (const subido of subidos) {
        const { clave } = await this.almacenamiento.guardar(subido.buffer, subido.mimetype);
        claves.push(clave);
      }
      const filas = subidos.map((subido, indice) =>
        this.archivos.create({
          clave: claves[indice],
          nombreOriginal: subido.originalname.slice(0, LONGITUD_MAXIMA_NOMBRE),
          tipoMime: subido.mimetype,
          tamanoBytes: subido.buffer.length,
          tipo,
          propietarioId,
          mascotaId,
        }),
      );
      return await this.archivos.save(filas);
    } catch (error) {
      await Promise.all(claves.map((clave) => this.eliminarFisico(clave)));
      throw error;
    }
  }

  private async eliminarFisico(clave: string): Promise<void> {
    try {
      await this.almacenamiento.eliminar(clave);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return;
      }
      // La fila ya no existe (o nunca se creó): se registra y no se interrumpe la operación.
      this.logger.warn(`No se pudo eliminar el archivo físico ${clave}: ${String(error)}`);
    }
  }

  private async buscar(id: number): Promise<Archivo> {
    const archivo = await this.archivos.findOneBy({ id });
    if (!archivo) {
      throw new NotFoundException(`Archivo ${id} no encontrado`);
    }
    return archivo;
  }

  private async puedeVer(archivo: Archivo, usuario: PayloadJwt): Promise<boolean> {
    if (puedeGestionarArchivo(archivo, usuario)) {
      return true;
    }
    if (archivo.tipo !== 'imagen' || archivo.mascotaId === null) {
      return false;
    }
    const mascota = await this.mascotasService.obtenerPorId(archivo.mascotaId);
    return mascota.estado === 'disponible';
  }

  private conUrl(archivo: Archivo): ArchivoConUrl {
    return Object.assign(archivo, this.firmar(archivo));
  }

  private firmar(archivo: Archivo): UrlFirmadaArchivo {
    const { expira, firma } = this.urlFirmada.firmar(archivo.id);
    const consulta = new URLSearchParams({ expira: String(expira), firma });
    return {
      url: `/${PREFIJO_API}/archivos/descargar/${archivo.id}?${consulta.toString()}`,
      expiraEn: new Date(expira * 1000).toISOString(),
    };
  }
}
