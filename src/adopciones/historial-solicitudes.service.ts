import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { EstadoSolicitud } from './adopcion.model';
import { HistorialSolicitud } from './entities/historial-solicitud.entity';
import type { SolicitudAdopcion } from './entities/solicitud-adopcion.entity';

@Injectable()
export class HistorialSolicitudesService {
  constructor(
    @InjectRepository(HistorialSolicitud)
    private readonly historial: Repository<HistorialSolicitud>,
  ) {}

  // Siempre dentro de la transacción del cambio de estado: si falla una, fallan ambas.
  async registrar(
    manager: EntityManager,
    solicitud: SolicitudAdopcion,
    estadoAnterior: EstadoSolicitud | null,
    estadoNuevo: EstadoSolicitud,
    usuarioId: number,
    comentario?: string,
  ): Promise<HistorialSolicitud> {
    const repositorio = manager.getRepository(HistorialSolicitud);
    return repositorio.save(
      repositorio.create({
        solicitudId: solicitud.id,
        estadoAnterior,
        estadoNuevo,
        usuarioId,
        comentario: comentario ?? null,
      }),
    );
  }

  async listar(solicitudId: number): Promise<HistorialSolicitud[]> {
    return this.historial.find({
      where: { solicitudId },
      order: { creadoEn: 'ASC', id: 'ASC' },
    });
  }
}
