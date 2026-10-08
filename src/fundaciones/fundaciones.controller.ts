import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

@Controller('fundaciones')
export class FundacionesController {
  // 1. GET /fundaciones
  @Get()
  obtenerFundacionesVerificadas() {
    return { mensaje: 'Lista de fundaciones verificadas' };
  }

  // 3. PATCH /fundaciones/mi_fundacion  
  @Patch('mi_fundacion')
  actualizarMiFundacion(@Body() datos: any) {
    return { mensaje: 'Datos de mi fundación actualizados', datos };
  }

  // 2. GET /fundaciones/:id
  @Get(':id')
  obtenerFundacionPorId(@Param('id') id: string) {
    return { mensaje: `Fundación con id ${id}` };
  }

  // 4. PATCH /fundaciones/:id/verificacion
  @Patch(':id/verificacion')
  verificarFundacion(@Param('id') id: string, @Body() datos: any) {
    return { mensaje: `Verificación de la fundación ${id} actualizada`, datos };
  }
}