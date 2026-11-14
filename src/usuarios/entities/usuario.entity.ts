import { ApiHideProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { EstadoUsuario, Rol } from '../../autenticacion/usuario.model';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  nombre: string;

  // Se guarda siempre en minúsculas.
  @Column({ length: 254, unique: true })
  email: string;

  // Nunca se selecciona por defecto: solo las consultas ...ConPassword de UsuariosRepositorio la traen.
  @ApiHideProperty()
  @Column({ name: 'password_hash', length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  rol: Rol;

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado: EstadoUsuario;

  // Datos de organización, solo para usuarios con rol 'fundacion'.
  @Column({ name: 'nombre_organizacion', type: 'varchar', length: 120, nullable: true })
  nombreOrganizacion: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ciudad: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ default: false })
  verificada: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
