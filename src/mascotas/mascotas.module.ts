import { Module } from '@nestjs/common';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

@Module({
  // AutenticacionModule aporta los guards y el JwtModule configurado con JWT_SECRET.
  imports: [AutenticacionModule],
  controllers: [MascotasController],
  providers: [MascotasService],
  exports: [MascotasService],
})
export class MascotasModule {}
