import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  FindOperator,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { PaginacionDto } from '../common/dto/paginacion.dto';
import { opcionesPagina, Paginado, paginado } from '../common/paginacion';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ActualizarMascotaDto } from './dto/actualizar-mascota.dto';
import { BuscarMascotasDto } from './dto/buscar-mascotas.dto';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { Mascota } from './entities/mascota.entity';
import { MASCOTA_ELIMINADA, MascotaEliminadaEvento } from './eventos/mascota-eliminada.evento';
import type { EstadoMascota } from './mascota.model';

// Estados a los que puede pasar una mascota desde cada estado actual.
const TRANSICIONES_PERMITIDAS: Record<EstadoMascota, EstadoMascota[]> = {
  disponible: ['en_proceso'],
  en_proceso: ['disponible', 'adoptada'],
  adoptada: [],
};

const ESTADOS_NO_ELIMINABLES: EstadoMascota[] = ['en_proceso', 'adoptada'];

@Injectable()
export class MascotasService {
  constructor(
    @InjectRepository(Mascota) private readonly mascotas: Repository<Mascota>,
    private readonly usuariosRepositorio: UsuariosRepositorio,
    private readonly eventos: EventEmitter2,
  ) {}

  async crear(fundacionId: number, datos: CreateMascotaDto): Promise<Mascota> {
    const fundacion = await this.usuariosRepositorio.buscarPorId(fundacionId);
    if (!fundacion?.verificada) {
      throw new ForbiddenException(
        'Tu fundación aún no está verificada. Un administrador debe verificarla antes de publicar mascotas',
      );
    }
    return this.mascotas.save(this.mascotas.create({ ...datos, fundacionId, estado: 'disponible' }));
  }

  async obtenerDisponibles(paginacion: PaginacionDto): Promise<Paginado<Mascota>> {
    return this.listar({ estado: 'disponible' }, paginacion);
  }

  // Todas las mascotas de la fundación, en cualquier estado.
  async obtenerDeFundacion(fundacionId: number, paginacion: PaginacionDto): Promise<Paginado<Mascota>> {
    return this.listar({ fundacionId }, paginacion);
  }

  async obtenerPorId(id: number): Promise<Mascota> {
    const mascota = await this.mascotas.findOneBy({ id });
    if (!mascota) {
      throw new NotFoundException(`Mascota ${id} no encontrada`);
    }
    return mascota;
  }

  // Los filtros se aplican en la consulta; la ciudad se compara sin distinguir mayúsculas.
  async buscar(filtros: BuscarMascotasDto): Promise<Paginado<Mascota>> {
    const { especie, tamano, sexo, ciudad, edadMinMeses, edadMaxMeses } = filtros;
    if (edadMinMeses !== undefined && edadMaxMeses !== undefined && edadMinMeses > edadMaxMeses) {
      throw new BadRequestException('edadMinMeses no puede ser mayor que edadMaxMeses');
    }

    const where: FindOptionsWhere<Mascota> = { estado: 'disponible' };
    if (especie) where.especie = especie;
    if (tamano) where.tamano = tamano;
    if (sexo) where.sexo = sexo;
    const ciudadBuscada = ciudad?.trim();
    if (ciudadBuscada) where.ciudad = ILike(escaparLike(ciudadBuscada));
    const edad = rangoEdad(edadMinMeses, edadMaxMeses);
    if (edad) where.edadMeses = edad;

    return this.listar(where, filtros);
  }

  async cambiarEstado(id: number, fundacionId: number, nuevoEstado: EstadoMascota): Promise<Mascota> {
    const mascota = await this.obtenerPorId(id);
    verificarDueno(mascota, fundacionId);
    validarTransicion(mascota, nuevoEstado);
    mascota.estado = nuevoEstado;
    return this.mascotas.save(mascota);
  }

  // Para otros módulos (adopciones): aplica TRANSICIONES_PERMITIDAS sin validar dueño.
  // Con manager, trabaja dentro de la transacción del llamador y bloquea la fila.
  async cambiarEstadoPorSistema(id: number, estado: EstadoMascota, manager?: EntityManager): Promise<Mascota> {
    const repositorio = manager ? manager.getRepository(Mascota) : this.mascotas;
    const mascota = await repositorio.findOne({
      where: { id },
      lock: manager ? { mode: 'pessimistic_write' } : undefined,
    });
    if (!mascota) {
      throw new NotFoundException(`Mascota ${id} no encontrada`);
    }
    validarTransicion(mascota, estado);
    mascota.estado = estado;
    return repositorio.save(mascota);
  }

  async actualizar(id: number, fundacionId: number, datos: ActualizarMascotaDto): Promise<Mascota> {
    const mascota = await this.obtenerPorId(id);
    verificarDueno(mascota, fundacionId);
    Object.assign(mascota, datos);
    return this.mascotas.save(mascota);
  }

  async eliminar(id: number, fundacionId: number): Promise<void> {
    const mascota = await this.obtenerPorId(id);
    verificarDueno(mascota, fundacionId);
    if (ESTADOS_NO_ELIMINABLES.includes(mascota.estado)) {
      throw new ConflictException(
        `No se puede eliminar la mascota ${id} porque está en estado '${mascota.estado}'`,
      );
    }
    await this.mascotas.remove(mascota);
    // emitAsync espera a los listeners; ellos registran sus propios errores y no los propagan.
    await this.eventos.emitAsync(MASCOTA_ELIMINADA, new MascotaEliminadaEvento(id));
  }

  private async listar(where: FindOptionsWhere<Mascota>, paginacion: PaginacionDto): Promise<Paginado<Mascota>> {
    const resultado = await this.mascotas.findAndCount({
      where,
      order: { id: 'ASC' },
      ...opcionesPagina(paginacion),
    });
    return paginado(resultado, paginacion);
  }
}

function validarTransicion(mascota: Mascota, nuevoEstado: EstadoMascota): void {
  if (!TRANSICIONES_PERMITIDAS[mascota.estado].includes(nuevoEstado)) {
    throw new ConflictException(
      `No se puede cambiar el estado de la mascota ${mascota.id} de '${mascota.estado}' a '${nuevoEstado}'`,
    );
  }
}

function verificarDueno(mascota: Mascota, fundacionId: number): void {
  if (mascota.fundacionId !== fundacionId) {
    throw new ForbiddenException('Solo la fundación dueña puede modificar esta mascota');
  }
}

function rangoEdad(min?: number, max?: number): FindOperator<number> | undefined {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

// Para que %, _ y \ escritos por el usuario se busquen literalmente con ILIKE.
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}
