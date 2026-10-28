import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { AutenticadoGuard } from './guards/autenticado.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  // El secreto y la expiración se pasan desde AutenticacionService al firmar.
  imports: [JwtModule.register({})],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, AutenticadoGuard, RolesGuard],
  exports: [AutenticacionService, AutenticadoGuard, RolesGuard],
})
export class AutenticacionModule {}
