import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Mascota } from './entities/mascota.entity';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

@Module({
  // AutenticacionModule aporta los guards y el JwtModule configurado con JWT_SECRET;
  // UsuariosModule, el repositorio para comprobar que la fundación esté verificada.
  imports: [TypeOrmModule.forFeature([Mascota]), AutenticacionModule, UsuariosModule],
  controllers: [MascotasController],
  providers: [MascotasService],
  // TypeOrmModule se exporta para que adopciones use Repository<Mascota> en sus transacciones.
  exports: [MascotasService, TypeOrmModule],
})
export class MascotasModule {}
