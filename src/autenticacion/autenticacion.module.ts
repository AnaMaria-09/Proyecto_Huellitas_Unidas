import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { VariablesEntorno } from '../config/env.model';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { ContrasenasService } from './contrasenas.service';
import { TokenRefresco } from './entities/token-refresco.entity';
import { AutenticacionOpcionalGuard } from './guards/autenticacion-opcional.guard';
import { AutenticadoGuard } from './guards/autenticado.guard';
import { RolesGuard } from './guards/roles.guard';
import { LimpiezaTokensService } from './limpieza-tokens.service';
import { TokensService } from './tokens.service';

@Module({
  // JwtService firma y verifica con JWT_SECRET, ya validado por ConfigModule al arrancar.
  // UsuariosModule importa este módulo para usar los guards, de ahí el forwardRef.
  imports: [
    TypeOrmModule.forFeature([TokenRefresco]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<VariablesEntorno, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
    forwardRef(() => UsuariosModule),
  ],
  controllers: [AutenticacionController],
  providers: [
    AutenticacionService,
    ContrasenasService,
    TokensService,
    LimpiezaTokensService,
    AutenticadoGuard,
    AutenticacionOpcionalGuard,
    RolesGuard,
  ],
  // JwtModule se exporta porque Nest instancia los guards en el módulo que los usa,
  // y AutenticadoGuard necesita JwtService allí.
  exports: [JwtModule, AutenticacionService, ContrasenasService, AutenticadoGuard, AutenticacionOpcionalGuard, RolesGuard],
})
export class AutenticacionModule {}
