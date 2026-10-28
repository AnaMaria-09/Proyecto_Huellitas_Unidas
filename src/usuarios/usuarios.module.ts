import { forwardRef, Module } from '@nestjs/common';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepositorio } from './usuarios.repositorio';
import { UsuariosService } from './usuarios.service';

@Module({
  // AutenticacionModule usa UsuariosRepositorio, de ahí el forwardRef.
  imports: [forwardRef(() => AutenticacionModule)],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepositorio],
  exports: [UsuariosRepositorio],
})
export class UsuariosModule {}
