import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { Mascota } from './mascota.model';

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
}
