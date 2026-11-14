import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { AdministradorInicialService } from './administrador-inicial.service';
import { Usuario } from './entities/usuario.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepositorio } from './usuarios.repositorio';
import { UsuariosService } from './usuarios.service';

@Module({
  // AutenticacionModule usa UsuariosRepositorio, de ahí el forwardRef.
  imports: [TypeOrmModule.forFeature([Usuario]), forwardRef(() => AutenticacionModule)],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepositorio, AdministradorInicialService],
  exports: [UsuariosRepositorio],
})
export class UsuariosModule {}
