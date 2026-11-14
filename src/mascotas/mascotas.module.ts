import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { Mascota } from './entities/mascota.entity';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

@Module({
  // AutenticacionModule aporta los guards y el JwtModule configurado con JWT_SECRET.
  imports: [TypeOrmModule.forFeature([Mascota]), AutenticacionModule],
  controllers: [MascotasController],
  providers: [MascotasService],
  // TypeOrmModule se exporta para que adopciones use Repository<Mascota> en sus transacciones.
  exports: [MascotasService, TypeOrmModule],
})
export class MascotasModule {}
