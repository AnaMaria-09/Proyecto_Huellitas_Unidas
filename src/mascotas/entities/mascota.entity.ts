import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import type { Especie, EstadoMascota, Sexo, Tamano } from '../mascota.model';

@Entity('mascotas')
export class Mascota {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'fundacion_id' })
  fundacionId: number;

  // La fundación (usuario con rol 'fundacion') que publicó la mascota. No se carga por defecto.
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fundacion_id' })
  fundacion?: Usuario;

  @Column({ length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 10 })
  especie: Especie;

  @Column({ type: 'varchar', length: 10 })
  tamano: Tamano;

  @Column({ name: 'edad_meses', type: 'int' })
  edadMeses: number;

  @Column({ type: 'varchar', length: 15 })
  sexo: Sexo;

  @Column({ length: 80 })
  ciudad: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Index()
  @Column({ type: 'varchar', length: 15, default: 'disponible' })
  estado: EstadoMascota;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creadaEn: Date;

  @UpdateDateColumn({ name: 'actualizada_en', type: 'timestamptz' })
  actualizadaEn: Date;
}
