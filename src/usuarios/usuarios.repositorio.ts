import { Injectable } from '@nestjs/common';
import { Usuario } from '../autenticacion/usuario.model';

// TODO: el almacenamiento en memoria se reemplazará por TypeORM (repositorio de Usuario).
@Injectable()
export class UsuariosRepositorio {
  private usuarios: Usuario[] = [];
  private siguienteId = 1;

  guardar(datos: Omit<Usuario, 'id'>): Usuario {
    const usuario: Usuario = { id: this.siguienteId++, ...datos };
    this.usuarios.push(usuario);
    return usuario;
  }

  buscarPorId(id: number): Usuario | undefined {
    return this.usuarios.find((u) => u.id === id);
  }

  buscarPorEmail(email: string): Usuario | undefined {
    const normalizado = email.toLowerCase();
    return this.usuarios.find((u) => u.email === normalizado);
  }

  listar(): Usuario[] {
    return [...this.usuarios];
  }

  actualizar(usuario: Usuario): Usuario | undefined {
    const indice = this.usuarios.findIndex((u) => u.id === usuario.id);
    if (indice === -1) {
      return undefined;
    }
    this.usuarios[indice] = usuario;
    return usuario;
  }
}
