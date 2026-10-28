import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { AutenticacionOpcionalGuard } from './guards/autenticacion-opcional.guard';
import { AutenticadoGuard } from './guards/autenticado.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  // El secreto y la expiración se pasan desde AutenticacionService al firmar.
  // UsuariosModule importa este módulo para usar los guards, de ahí el forwardRef.
  imports: [JwtModule.register({}), forwardRef(() => UsuariosModule)],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, AutenticadoGuard, AutenticacionOpcionalGuard, RolesGuard],
  // JwtModule se exporta porque Nest instancia los guards en el módulo que los usa,
  // y AutenticadoGuard necesita JwtService allí.
  exports: [JwtModule, AutenticacionService, AutenticadoGuard, AutenticacionOpcionalGuard, RolesGuard],
})
export class AutenticacionModule {}
