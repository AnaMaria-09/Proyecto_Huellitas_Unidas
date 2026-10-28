import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { MascotasService } from './mascotas.service';

const FUNDACION_ID = 1;

function datosMascota(cambios: Partial<CreateMascotaDto> = {}): CreateMascotaDto {
  return {
    nombre: 'Firulais',
    especie: 'perro',
    tamano: 'mediano',
    edadMeses: 24,
    sexo: 'macho',
    ciudad: 'Bogotá',
    ...cambios,
  };
}

describe('MascotasService', () => {
  let service: MascotasService;

  beforeEach(() => {
    service = new MascotasService();
  });

  describe('cambiarEstado', () => {
    it('permite disponible → en_proceso', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      expect(service.cambiarEstado(mascota.id, 'en_proceso').estado).toBe('en_proceso');
    });

    it('permite en_proceso → disponible (cancelar solicitud)', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      service.cambiarEstado(mascota.id, 'en_proceso');
      expect(service.cambiarEstado(mascota.id, 'disponible').estado).toBe('disponible');
    });

    it('permite en_proceso → adoptada', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      service.cambiarEstado(mascota.id, 'en_proceso');
      expect(service.cambiarEstado(mascota.id, 'adoptada').estado).toBe('adoptada');
    });

    it('rechaza disponible → adoptada', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      expect(() => service.cambiarEstado(mascota.id, 'adoptada')).toThrow(ConflictException);
    });

    it('rechaza cualquier cambio desde adoptada, indicando estado actual y solicitado', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      service.cambiarEstado(mascota.id, 'en_proceso');
      service.cambiarEstado(mascota.id, 'adoptada');

      expect(() => service.cambiarEstado(mascota.id, 'disponible')).toThrow(/'adoptada' a 'disponible'/);
      expect(() => service.cambiarEstado(mascota.id, 'en_proceso')).toThrow(ConflictException);
    });
  });

  describe('buscar', () => {
    beforeEach(() => {
      service.crear(FUNDACION_ID, datosMascota({ nombre: 'Perro joven', edadMeses: 6 }));
      service.crear(FUNDACION_ID, datosMascota({ nombre: 'Perro adulto', edadMeses: 48, ciudad: 'Cali' }));
      service.crear(FUNDACION_ID, datosMascota({ nombre: 'Gata', especie: 'gato', sexo: 'hembra', edadMeses: 12 }));
      const enProceso = service.crear(FUNDACION_ID, datosMascota({ nombre: 'Perro en proceso' }));
      service.cambiarEstado(enProceso.id, 'en_proceso');
    });

    it('sin filtros devuelve solo las disponibles', () => {
      expect(service.buscar({}).map((m) => m.nombre)).toEqual(['Perro joven', 'Perro adulto', 'Gata']);
    });

    it('filtra por especie y excluye las no disponibles', () => {
      const resultado = service.buscar({ especie: 'perro' });
      expect(resultado.map((m) => m.nombre)).toEqual(['Perro joven', 'Perro adulto']);
    });

    it('combina sexo y ciudad', () => {
      expect(service.buscar({ sexo: 'hembra', ciudad: 'bogotá' }).map((m) => m.nombre)).toEqual(['Gata']);
    });

    it('filtra por rango de edad', () => {
      const resultado = service.buscar({ edadMinMeses: 10, edadMaxMeses: 30 });
      expect(resultado.map((m) => m.nombre)).toEqual(['Gata']);
    });

    it('lanza BadRequest si edadMinMeses > edadMaxMeses', () => {
      expect(() => service.buscar({ edadMinMeses: 30, edadMaxMeses: 10 })).toThrow(BadRequestException);
    });
  });

  describe('actualizar', () => {
    it('lanza Forbidden si la fundación no es la dueña', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      expect(() => service.actualizar(mascota.id, 99, { nombre: 'Otro' })).toThrow(ForbiddenException);
    });
  });

  describe('eliminar', () => {
    it('elimina una mascota disponible', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      service.eliminar(mascota.id, FUNDACION_ID);
      expect(service.obtenerDisponibles()).toHaveLength(0);
    });

    it('lanza Conflict si la mascota está en proceso', () => {
      const mascota = service.crear(FUNDACION_ID, datosMascota());
      service.cambiarEstado(mascota.id, 'en_proceso');
      expect(() => service.eliminar(mascota.id, FUNDACION_ID)).toThrow(ConflictException);
    });
  });
});
