import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ActualizarMascotaDto } from './dto/actualizar-mascota.dto';
import { BuscarMascotasDto } from './dto/buscar-mascotas.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { MascotasService } from './mascotas.service';

// TODO: la cabecera 'x-fundacion-id' se reemplazará por el id del token JWT cuando el módulo de autenticación esté en main.
@Controller('mascotas')
export class MascotasController {
  constructor(private readonly mascotasService: MascotasService) {}

  @Post()
  crear(@Headers('x-fundacion-id') fundacionId: string | undefined, @Body() datos: CreateMascotaDto) {
    return this.mascotasService.crear(this.fundacionDesdeCabecera(fundacionId), datos);
  }

  @Get()
  obtenerDisponibles() {
    return this.mascotasService.obtenerDisponibles();
  }

  // Debe declararse antes de GET /:id para que "buscar" no se interprete como un id.
  @Get('buscar')
  buscar(@Query() filtros: BuscarMascotasDto) {
    return this.mascotasService.buscar(filtros);
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.mascotasService.obtenerPorId(id);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() datos: CambiarEstadoDto) {
    return this.mascotasService.cambiarEstado(id, datos.estado);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-fundacion-id') fundacionId: string | undefined,
    @Body() datos: ActualizarMascotaDto,
  ) {
    return this.mascotasService.actualizar(id, this.fundacionDesdeCabecera(fundacionId), datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number, @Headers('x-fundacion-id') fundacionId: string | undefined) {
    this.mascotasService.eliminar(id, this.fundacionDesdeCabecera(fundacionId));
  }

  private fundacionDesdeCabecera(fundacionId: string | undefined): number {
    if (!fundacionId) {
      throw new UnauthorizedException('Falta la cabecera x-fundacion-id');
    }
    return Number(fundacionId);
  }
}
