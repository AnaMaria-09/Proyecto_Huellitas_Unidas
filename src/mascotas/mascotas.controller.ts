import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import type { RequestConUsuario } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { ActualizarMascotaDto } from './dto/actualizar-mascota.dto';
import { BuscarMascotasDto } from './dto/buscar-mascotas.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { MascotasService } from './mascotas.service';

// La fundación se identifica por el 'sub' del JWT.
@Controller('mascotas')
export class MascotasController {
  constructor(private readonly mascotasService: MascotasService) {}

  @Post()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  crear(@Req() req: RequestConUsuario, @Body() datos: CreateMascotaDto) {
    return this.mascotasService.crear(req.usuario!.sub, datos);
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
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() datos: CambiarEstadoDto) {
    return this.mascotasService.cambiarEstado(id, datos.estado);
  }

  @Put(':id')
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario,
    @Body() datos: ActualizarMascotaDto,
  ) {
    return this.mascotasService.actualizar(id, req.usuario!.sub, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: RequestConUsuario) {
    this.mascotasService.eliminar(id, req.usuario!.sub);
  }
}
