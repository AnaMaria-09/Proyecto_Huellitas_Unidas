import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MASCOTA_ELIMINADA,
  MascotaEliminadaEvento,
} from '../../mascotas/eventos/mascota-eliminada.evento';
import type { ProveedorAlmacenamiento } from '../almacenamiento/proveedor-almacenamiento.interface';
import { PROVEEDOR_ALMACENAMIENTO } from '../almacenamiento/tokens';
import { Archivo } from '../entities/archivo.entity';

// Borra las imágenes de una mascota eliminada: primero los archivos físicos y luego sus filas.
// Nunca lanza: un fallo se registra y el borrado de la mascota ya quedó hecho.
@Injectable()
export class MascotaEliminadaListener {
  private readonly logger = new Logger(MascotaEliminadaListener.name);

  constructor(
    @InjectRepository(Archivo) private readonly archivos: Repository<Archivo>,
    @Inject(PROVEEDOR_ALMACENAMIENTO)
    private readonly almacenamiento: ProveedorAlmacenamiento,
  ) {}

  @OnEvent(MASCOTA_ELIMINADA)
  async alEliminarMascota({
    mascotaId,
  }: MascotaEliminadaEvento): Promise<void> {
    try {
      const filas = await this.archivos.find({
        where: { mascotaId },
        select: { id: true, clave: true },
      });
      for (const { clave } of filas) {
        await this.eliminarFisico(clave);
      }
      if (filas.length > 0) {
        await this.archivos.delete({ mascotaId });
      }
    } catch (error) {
      this.logger.error(
        `No se pudieron limpiar los archivos de la mascota ${mascotaId}: ${String(error)}`,
      );
    }
  }

  private async eliminarFisico(clave: string): Promise<void> {
    try {
      await this.almacenamiento.eliminar(clave);
    } catch (error) {
      // Si ya no está en disco no hay nada que limpiar.
      if (error instanceof NotFoundException) return;
      this.logger.warn(
        `No se pudo eliminar el archivo físico ${clave}: ${String(error)}`,
      );
    }
  }
}
