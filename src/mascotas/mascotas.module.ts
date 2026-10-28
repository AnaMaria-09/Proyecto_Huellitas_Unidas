import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MascotasController],
  providers: [MascotasService],
  exports: [MascotasService],
})
export class MascotasModule {}
