import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContrasenasService } from '../autenticacion/contrasenas.service';
import type { VariablesEntorno } from '../config/env.model';
import { UsuariosRepositorio } from './usuarios.repositorio';

// Al arrancar, si no hay ningún administrador y están ADMIN_EMAIL y ADMIN_PASSWORD, lo crea.
// Es la única forma de crear un administrador: el registro público no lo permite.
@Injectable()
export class AdministradorInicialService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdministradorInicialService.name);

  constructor(
    private readonly usuariosRepositorio: UsuariosRepositorio,
    private readonly contrasenas: ContrasenasService,
    private readonly config: ConfigService<VariablesEntorno, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get('ADMIN_EMAIL', { infer: true });
    const password = this.config.get('ADMIN_PASSWORD', { infer: true });
    if (!email || !password) {
      return;
    }
    if (await this.usuariosRepositorio.existeConRol('administrador')) {
      return;
    }
    if (await this.usuariosRepositorio.buscarPorEmail(email)) {
      this.logger.warn(`No se creó el administrador inicial: ${email} ya está registrado con otro rol`);
      return;
    }

    await this.usuariosRepositorio.guardar({
      nombre: 'Administrador',
      email,
      passwordHash: await this.contrasenas.hashear(password),
      rol: 'administrador',
    });
    this.logger.log(`Administrador inicial creado: ${email}`);
  }
}
