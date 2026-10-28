export type Especie = 'perro' | 'gato' | 'otro';

export type Tamano = 'pequeno' | 'mediano' | 'grande';

export type Sexo = 'macho' | 'hembra' | 'desconocido';

export type EstadoMascota = 'disponible' | 'en_proceso' | 'adoptada';

export interface Mascota {
  id: number;
  fundacionId: number;
  nombre: string;
  especie: Especie;
  tamano: Tamano;
  edadMeses: number;
  sexo: Sexo;
  ciudad: string;
  descripcion?: string;
  estado: EstadoMascota;
  creadaEn: Date;
}
