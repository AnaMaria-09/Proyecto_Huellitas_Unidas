import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AutenticacionService } from './autenticacion.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  // POST /autenticacion/registro
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() datos: RegistroDto) {
    return this.autenticacionService.registrar(datos);
  }

  // POST /autenticacion/iniciar_sesion
  @Post('iniciar_sesion')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() datos: IniciarSesionDto) {
    return this.autenticacionService.iniciarSesion(datos);
  }
}
