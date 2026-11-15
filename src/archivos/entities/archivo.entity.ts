import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Mascota } from '../../mascotas/entities/mascota.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import type { CategoriaArchivo } from '../validacion/reglas-archivos';

@Entity('archivos')
export class Archivo {
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre con el que se guardó en el almacenamiento (UUID + extensión). Nunca el nombre original.
  @Column({ length: 64, unique: true })
  clave: string;

  // Solo informativo: no se usa para guardar ni para servir el archivo.
  @Column({ name: 'nombre_original', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'tipo_mime', length: 100 })
  tipoMime: string;

  @Column({ name: 'tamano_bytes', type: 'int' })
  tamanoBytes: number;

  @Column({ type: 'varchar', length: 15 })
  tipo: CategoriaArchivo;

  @Index()
  @Column({ name: 'propietario_id' })
  propietarioId: number;

  // Quien subió el archivo. No se carga por defecto.
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'propietario_id' })
  propietario?: Usuario;

  // Solo las imágenes de mascotas lo tienen; los documentos quedan en null.
  @Index()
  @Column({ name: 'mascota_id', type: 'int', nullable: true })
  mascotaId: number | null;

  // Sin clave foránea a propósito: al borrar la mascota, el listener de 'mascota.eliminada'
  // necesita leer estas filas para borrar los archivos físicos, y después borra las filas.
  @ManyToOne(() => Mascota, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'mascota_id' })
  mascota?: Mascota | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
