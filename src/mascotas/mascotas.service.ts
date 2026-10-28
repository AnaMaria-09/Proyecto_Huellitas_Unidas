import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActualizarMascotaDto } from './dto/actualizar-mascota.dto';
import { BuscarMascotasDto } from './dto/buscar-mascotas.dto';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { EstadoMascota, Mascota } from './mascota.model';

// Estados a los que puede pasar una mascota desde cada estado actual.
const TRANSICIONES_PERMITIDAS: Record<EstadoMascota, EstadoMascota[]> = {
  disponible: ['en_proceso'],
  en_proceso: ['disponible', 'adoptada'],
  adoptada: [],
};

const ESTADOS_NO_ELIMINABLES: EstadoMascota[] = ['en_proceso', 'adoptada'];

// TODO: el almacenamiento en memoria se reemplazará por TypeORM (repositorio de Mascota).
@Injectable()
export class MascotasService {
  private mascotas: Mascota[] = [];
  private siguienteId = 1;

  crear(fundacionId: number, datos: CreateMascotaDto): Mascota {
    const mascota: Mascota = {
      id: this.siguienteId++,
      fundacionId,
      ...datos,
      estado: 'disponible',
      creadaEn: new Date(),
    };
    this.mascotas.push(mascota);
    return mascota;
  }

  obtenerDisponibles(): Mascota[] {
    return this.mascotas.filter((mascota) => mascota.estado === 'disponible');
  }

  obtenerPorId(id: number): Mascota {
    const mascota = this.mascotas.find((m) => m.id === id);
    if (!mascota) {
      throw new NotFoundException(`Mascota ${id} no encontrada`);
    }
    return mascota;
  }

  buscar(filtros: BuscarMascotasDto): Mascota[] {
    const { especie, tamano, sexo, ciudad, edadMinMeses, edadMaxMeses } = filtros;
    if (edadMinMeses !== undefined && edadMaxMeses !== undefined && edadMinMeses > edadMaxMeses) {
      throw new BadRequestException('edadMinMeses no puede ser mayor que edadMaxMeses');
    }
    const ciudadBuscada = ciudad?.trim().toLowerCase();

    return this.obtenerDisponibles().filter(
      (m) =>
        (especie === undefined || m.especie === especie) &&
        (tamano === undefined || m.tamano === tamano) &&
        (sexo === undefined || m.sexo === sexo) &&
        (ciudadBuscada === undefined || m.ciudad.trim().toLowerCase() === ciudadBuscada) &&
        (edadMinMeses === undefined || m.edadMeses >= edadMinMeses) &&
        (edadMaxMeses === undefined || m.edadMeses <= edadMaxMeses),
    );
  }

  cambiarEstado(id: number, nuevoEstado: EstadoMascota): Mascota {
    const mascota = this.obtenerPorId(id);
    if (!TRANSICIONES_PERMITIDAS[mascota.estado].includes(nuevoEstado)) {
      throw new ConflictException(
        `No se puede cambiar el estado de la mascota ${id} de '${mascota.estado}' a '${nuevoEstado}'`,
      );
    }
    mascota.estado = nuevoEstado;
    return mascota;
  }

  actualizar(id: number, fundacionId: number, datos: ActualizarMascotaDto): Mascota {
    const mascota = this.obtenerPorId(id);
    this.verificarDueno(mascota, fundacionId);
    Object.assign(mascota, datos);
    return mascota;
  }

  eliminar(id: number, fundacionId: number): void {
    const mascota = this.obtenerPorId(id);
    this.verificarDueno(mascota, fundacionId);
    if (ESTADOS_NO_ELIMINABLES.includes(mascota.estado)) {
      throw new ConflictException(
        `No se puede eliminar la mascota ${id} porque está en estado '${mascota.estado}'`,
      );
    }
    this.mascotas = this.mascotas.filter((m) => m.id !== id);
  }

  private verificarDueno(mascota: Mascota, fundacionId: number): void {
    if (mascota.fundacionId !== fundacionId) {
      throw new ForbiddenException('Solo la fundación dueña puede modificar esta mascota');
    }
  }
}
