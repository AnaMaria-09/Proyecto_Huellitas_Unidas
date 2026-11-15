import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { opcionesPagina, Paginado, paginado } from '../common/paginacion';
import { Mascota } from '../mascotas/entities/mascota.entity';
import { MascotasService } from '../mascotas/mascotas.service';
import {
  esAdoptante,
  esFundacionDuena,
  puedeVerSolicitud,
} from './acceso-solicitudes';
import type { EstadoSolicitud } from './adopcion.model';
import { efectoEnMascota } from './dominio/efectos-en-mascota';
import {
  ESTADOS_ACTIVOS,
  validarTransicion,
} from './dominio/transiciones-solicitud';
import { ConfirmarEntregaDto } from './dto/confirmar-entrega.dto';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { EvaluarSolicitudDto } from './dto/evaluar-solicitud.dto';
import { ListarSolicitudesDto } from './dto/listar-solicitudes.dto';
import { HistorialSolicitud } from './entities/historial-solicitud.entity';
import { SolicitudAdopcion } from './entities/solicitud-adopcion.entity';
import { HistorialSolicitudesService } from './historial-solicitudes.service';

export const MOTIVO_ASIGNADA_A_OTRA =
  'La mascota fue asignada a otra solicitud';

// Lo que cambia junto con el estado en cambiarEstado.
interface DatosCambio {
  comentario?: string;
  motivoRechazo?: string;
  observaciones?: string;
  fechaEntrega?: Date;
}

// Campos que se devuelven; del adoptante solo id, nombre y email.
const CAMPOS_SOLICITUD: FindOptionsSelect<SolicitudAdopcion> = {
  id: true,
  mascotaId: true,
  adoptanteId: true,
  estado: true,
  mensaje: true,
  motivoRechazo: true,
  observaciones: true,
  fechaEntrega: true,
  creadaEn: true,
  actualizadaEn: true,
  mascota: {
    id: true,
    nombre: true,
    especie: true,
    estado: true,
    fundacionId: true,
  },
};

const CAMPOS_CON_ADOPTANTE: FindOptionsSelect<SolicitudAdopcion> = {
  ...CAMPOS_SOLICITUD,
  adoptante: { id: true, nombre: true, email: true },
};

const BLOQUEO = { mode: 'pessimistic_write' } as const;

@Injectable()
export class AdopcionesService {
  constructor(
    @InjectRepository(SolicitudAdopcion)
    private readonly solicitudes: Repository<SolicitudAdopcion>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly historial: HistorialSolicitudesService,
    private readonly mascotas: MascotasService,
  ) {}

  async crear(
    usuario: PayloadJwt,
    datos: CrearSolicitudDto,
  ): Promise<SolicitudAdopcion> {
    const { mascotaId, mensaje } = datos;
    return this.dataSource.transaction(async (manager) => {
      // El bloqueo de la mascota ordena esta transacción con las evaluaciones de la misma mascota.
      const mascota = await manager
        .getRepository(Mascota)
        .findOne({ where: { id: mascotaId }, lock: BLOQUEO });
      if (!mascota) {
        throw new NotFoundException(`Mascota ${mascotaId} no encontrada`);
      }
      if (mascota.estado !== 'disponible') {
        throw new ConflictException(
          `La mascota ${mascotaId} no está disponible para adopción`,
        );
      }

      const repositorio = manager.getRepository(SolicitudAdopcion);
      const activa = await repositorio.findOne({
        where: ESTADOS_ACTIVOS.map((estado) => ({
          mascotaId,
          adoptanteId: usuario.sub,
          estado,
        })),
      });
      if (activa) {
        throw new ConflictException(
          `Ya tienes una solicitud activa (${activa.id}) para la mascota ${mascotaId}`,
        );
      }

      const solicitud = await repositorio.save(
        repositorio.create({
          mascotaId,
          adoptanteId: usuario.sub,
          mensaje,
          estado: 'pendiente',
          motivoRechazo: null,
          observaciones: null,
          fechaEntrega: null,
        }),
      );
      await this.historial.registrar(
        manager,
        solicitud,
        null,
        'pendiente',
        usuario.sub,
      );
      return solicitud;
    });
  }

  async listarMias(
    usuario: PayloadJwt,
    filtros: ListarSolicitudesDto,
  ): Promise<Paginado<SolicitudAdopcion>> {
    return this.listar({ adoptanteId: usuario.sub }, filtros);
  }

  async listarRecibidas(
    usuario: PayloadJwt,
    filtros: ListarSolicitudesDto,
  ): Promise<Paginado<SolicitudAdopcion>> {
    return this.listar({ mascota: { fundacionId: usuario.sub } }, filtros);
  }

  // 404 también cuando existe pero el usuario no puede verla, para no revelar qué ids existen.
  async obtener(id: number, usuario: PayloadJwt): Promise<SolicitudAdopcion> {
    const solicitud = await this.solicitudes.findOne({
      where: { id },
      relations: { mascota: true, adoptante: true },
      select: CAMPOS_CON_ADOPTANTE,
    });
    if (!solicitud || !puedeVerSolicitud(solicitud, usuario)) {
      throw new NotFoundException(`Solicitud ${id} no encontrada`);
    }
    return solicitud;
  }

  async listarHistorial(
    id: number,
    usuario: PayloadJwt,
  ): Promise<HistorialSolicitud[]> {
    await this.obtener(id, usuario);
    return this.historial.listar(id);
  }

  // Al aprobar, la mascota pasa a en_proceso y las demás solicitudes pendientes se rechazan.
  async evaluar(
    id: number,
    usuario: PayloadJwt,
    datos: EvaluarSolicitudDto,
  ): Promise<SolicitudAdopcion> {
    return this.dataSource.transaction(async (manager) => {
      const { solicitud, mascota } = await this.bloquear(manager, id);
      verificarFundacionDuena(mascota, usuario, 'evaluar');

      if (datos.decision === 'rechazada') {
        return this.cambiarEstado(
          manager,
          solicitud,
          'rechazada',
          usuario.sub,
          {
            motivoRechazo: datos.motivo,
            observaciones: datos.observaciones,
            comentario: datos.motivo,
          },
        );
      }

      const aprobada = await this.cambiarEstado(
        manager,
        solicitud,
        'aprobada',
        usuario.sub,
        {
          observaciones: datos.observaciones,
          comentario: datos.observaciones,
        },
      );
      const otras = await manager.getRepository(SolicitudAdopcion).find({
        where: { mascotaId: solicitud.mascotaId, estado: 'pendiente' },
        lock: BLOQUEO,
      });
      for (const otra of otras.filter(
        (pendiente) => pendiente.id !== solicitud.id,
      )) {
        await this.cambiarEstado(manager, otra, 'rechazada', usuario.sub, {
          motivoRechazo: MOTIVO_ASIGNADA_A_OTRA,
          comentario: MOTIVO_ASIGNADA_A_OTRA,
        });
      }
      return aprobada;
    });
  }

  async confirmarEntrega(
    id: number,
    usuario: PayloadJwt,
    datos: ConfirmarEntregaDto,
  ): Promise<SolicitudAdopcion> {
    return this.dataSource.transaction(async (manager) => {
      const { solicitud, mascota } = await this.bloquear(manager, id);
      verificarFundacionDuena(mascota, usuario, 'confirmar la entrega de');
      return this.cambiarEstado(manager, solicitud, 'completada', usuario.sub, {
        fechaEntrega: new Date(datos.fechaEntrega),
      });
    });
  }

  // No borra la fila: la deja cancelada. Si estaba aprobada, la mascota vuelve a estar disponible.
  async cancelar(id: number, usuario: PayloadJwt): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const { solicitud } = await this.bloquear(manager, id);
      if (!esAdoptante(solicitud, usuario)) {
        throw new NotFoundException(`Solicitud ${id} no encontrada`);
      }
      await this.cambiarEstado(manager, solicitud, 'cancelada', usuario.sub);
    });
  }

  // Único punto donde cambia el estado de una solicitud: valida la transición, guarda,
  // registra el historial y aplica el efecto en la mascota, todo en la transacción de manager.
  private async cambiarEstado(
    manager: EntityManager,
    solicitud: SolicitudAdopcion,
    nuevoEstado: EstadoSolicitud,
    usuarioId: number,
    datos: DatosCambio = {},
  ): Promise<SolicitudAdopcion> {
    const estadoAnterior = solicitud.estado;
    validarTransicion(estadoAnterior, nuevoEstado);

    solicitud.estado = nuevoEstado;
    if (datos.motivoRechazo !== undefined)
      solicitud.motivoRechazo = datos.motivoRechazo;
    if (datos.observaciones !== undefined)
      solicitud.observaciones = datos.observaciones;
    if (datos.fechaEntrega !== undefined)
      solicitud.fechaEntrega = datos.fechaEntrega;
    const guardada = await manager
      .getRepository(SolicitudAdopcion)
      .save(solicitud);

    await this.historial.registrar(
      manager,
      guardada,
      estadoAnterior,
      nuevoEstado,
      usuarioId,
      datos.comentario,
    );

    const estadoMascota = efectoEnMascota(estadoAnterior, nuevoEstado);
    if (estadoMascota) {
      await this.mascotas.cambiarEstadoPorSistema(
        guardada.mascotaId,
        estadoMascota,
        manager,
      );
    }
    return guardada;
  }

  // Bloquea primero la mascota y después la solicitud. Todas las transacciones de adopciones
  // siguen ese orden, así dos evaluaciones de la misma mascota esperan en vez de bloquearse entre sí.
  private async bloquear(
    manager: EntityManager,
    id: number,
  ): Promise<{ solicitud: SolicitudAdopcion; mascota: Mascota }> {
    const repositorio = manager.getRepository(SolicitudAdopcion);
    const encontrada = await repositorio.findOneBy({ id });
    if (!encontrada) {
      throw new NotFoundException(`Solicitud ${id} no encontrada`);
    }
    const mascota = await manager.getRepository(Mascota).findOne({
      where: { id: encontrada.mascotaId },
      lock: BLOQUEO,
    });
    // Se vuelve a leer con bloqueo: otra transacción pudo cambiar el estado mientras se esperaba.
    const solicitud = await repositorio.findOne({
      where: { id },
      lock: BLOQUEO,
    });
    if (!mascota || !solicitud) {
      throw new NotFoundException(`Solicitud ${id} no encontrada`);
    }
    return { solicitud, mascota };
  }

  private async listar(
    where: FindOptionsWhere<SolicitudAdopcion>,
    filtros: ListarSolicitudesDto,
  ): Promise<Paginado<SolicitudAdopcion>> {
    const resultado = await this.solicitudes.findAndCount({
      where: filtros.estado ? { ...where, estado: filtros.estado } : where,
      relations: { mascota: true, adoptante: true },
      select: CAMPOS_CON_ADOPTANTE,
      order: { id: 'DESC' },
      ...opcionesPagina(filtros),
    });
    return paginado(resultado, filtros);
  }
}

function verificarFundacionDuena(
  mascota: Mascota,
  usuario: PayloadJwt,
  accion: string,
): void {
  if (!esFundacionDuena(mascota, usuario)) {
    throw new ForbiddenException(
      `Solo la fundación dueña de la mascota puede ${accion} esta solicitud`,
    );
  }
}
