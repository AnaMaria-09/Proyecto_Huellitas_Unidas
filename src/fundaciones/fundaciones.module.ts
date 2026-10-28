import { Module } from '@nestjs/common';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { FundacionesController } from './fundaciones.controller';
import { FundacionesService } from './fundaciones.service';

@Module({
  imports: [AutenticacionModule, UsuariosModule],
  controllers: [FundacionesController],
  providers: [FundacionesService],
  exports: [FundacionesService],
})
export class FundacionesModule {}
