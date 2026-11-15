import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import type { EstadoSolicitud } from '../adopcion.model';
import { SolicitudAdopcion } from './solicitud-adopcion.entity';

// Un registro por cada cambio de estado de una solicitud, incluida su creación (estadoAnterior null).
@Entity('historial_solicitudes')
export class HistorialSolicitud {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'solicitud_id' })
  solicitudId: number;

  @ManyToOne(() => SolicitudAdopcion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud?: SolicitudAdopcion;

  @Column({
    name: 'estado_anterior',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  estadoAnterior: EstadoSolicitud | null;

  @Column({ name: 'estado_nuevo', type: 'varchar', length: 15 })
  estadoNuevo: EstadoSolicitud;

  // Quién hizo el cambio: el adoptante, la fundación o un administrador.
  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
