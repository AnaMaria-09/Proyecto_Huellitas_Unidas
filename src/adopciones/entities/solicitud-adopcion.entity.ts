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
import { Mascota } from '../../mascotas/entities/mascota.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import type { EstadoSolicitud } from '../adopcion.model';

@Entity('solicitudes_adopcion')
export class SolicitudAdopcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'mascota_id' })
  mascotaId: number;

  // No se carga por defecto. Si se elimina la mascota (solo se puede mientras está disponible),
  // sus solicitudes pendientes, rechazadas o canceladas se eliminan con ella.
  @ManyToOne(() => Mascota, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mascota_id' })
  mascota?: Mascota;

  // El ciudadano que pide adoptar.
  @Index()
  @Column({ name: 'adoptante_id' })
  adoptanteId: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'adoptante_id' })
  adoptante?: Usuario;

  @Index()
  @Column({ type: 'varchar', length: 15, default: 'pendiente' })
  estado: EstadoSolicitud;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'fecha_entrega', type: 'timestamptz', nullable: true })
  fechaEntrega: Date | null;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creadaEn: Date;

  @UpdateDateColumn({ name: 'actualizada_en', type: 'timestamptz' })
  actualizadaEn: Date;
}
