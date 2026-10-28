import { Body, Controller, Get, Headers, Param, ParseIntPipe, Post, UnauthorizedException } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { MascotasService } from './mascotas.service';

// TODO: la cabecera 'x-fundacion-id' se reemplazará por el id del token cuando exista autenticación.
@Controller('mascotas')
export class MascotasController {
  constructor(private readonly mascotasService: MascotasService) {}

  @Post()
  crear(@Headers('x-fundacion-id') fundacionId: string | undefined, @Body() datos: CreateMascotaDto) {
    if (!fundacionId) {
      throw new UnauthorizedException('Falta la cabecera x-fundacion-id');
    }
    return this.mascotasService.crear(Number(fundacionId), datos);
  }

  @Get()
  obtenerDisponibles() {
    return this.mascotasService.obtenerDisponibles();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.mascotasService.obtenerPorId(id);
  }
}
