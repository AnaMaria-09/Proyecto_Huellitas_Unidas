import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { AutenticacionOpcionalGuard } from '../autenticacion/guards/autenticacion-opcional.guard';
import { AutenticadoGuard } from '../autenticacion/guards/autenticado.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import type { PayloadJwt } from '../autenticacion/usuario.model';
import { ArchivosService } from './archivos.service';
import type { ArchivoSubido } from './archivos.service';
import { DescargarArchivoDto } from './dto/descargar-archivo.dto';
import { SubirImagenesDto } from './dto/subir-imagenes.dto';
import { ErroresMulterFilter } from './errores-multer.filter';
import { REGLAS_ARCHIVOS } from './validacion/reglas-archivos';

const MAXIMO_IMAGENES = 5;

// Multer corta la subida al pasar el tamaño máximo de la categoría; ValidadorArchivos revisa el resto.
// defParamCharset: 'utf8' para que los nombres con tildes o ñ lleguen bien.
const OPCIONES_IMAGENES = {
  limits: { fileSize: REGLAS_ARCHIVOS.imagen.tamanoMaximoBytes, files: MAXIMO_IMAGENES },
  defParamCharset: 'utf8',
};
const OPCIONES_DOCUMENTO = {
  limits: { fileSize: REGLAS_ARCHIVOS.documento.tamanoMaximoBytes, files: 1 },
  defParamCharset: 'utf8',
};

@ApiTags('archivos')
@Controller('archivos')
@UseFilters(ErroresMulterFilter)
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  // POST /archivos/imagenes: hasta 5 imágenes (JPEG, PNG o WEBP, máx. 5 MB cada una) de una mascota propia.
  @Post('imagenes')
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard, RolesGuard)
  @Roles('fundacion')
  @UseInterceptors(FilesInterceptor('imagenes', MAXIMO_IMAGENES, OPCIONES_IMAGENES))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['mascotaId', 'imagenes'],
      properties: {
        mascotaId: { type: 'integer', example: 1 },
        imagenes: { type: 'array', maxItems: MAXIMO_IMAGENES, items: { type: 'string', format: 'binary' } },
      },
    },
  })
  subirImagenes(
    @UsuarioActual() usuario: PayloadJwt,
    @Body() datos: SubirImagenesDto,
    @UploadedFiles() imagenes: ArchivoSubido[] | undefined,
  ) {
    return this.archivosService.subirImagenes(usuario, datos.mascotaId, imagenes ?? []);
  }

  // POST /archivos/documentos: un PDF (máx. 10 MB) de cualquier usuario autenticado.
  @Post('documentos')
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard)
  @UseInterceptors(FileInterceptor('documento', OPCIONES_DOCUMENTO))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documento'],
      properties: { documento: { type: 'string', format: 'binary' } },
    },
  })
  subirDocumento(@UsuarioActual() usuario: PayloadJwt, @UploadedFile() documento: ArchivoSubido | undefined) {
    return this.archivosService.subirDocumento(usuario, documento);
  }

  // GET /archivos/mascota/:mascotaId: público si la mascota está disponible. Va antes de /:id/url_firmada.
  @Get('mascota/:mascotaId')
  @ApiBearerAuth()
  @UseGuards(AutenticacionOpcionalGuard)
  listarImagenesDeMascota(
    @Param('mascotaId', ParseIntPipe) mascotaId: number,
    @UsuarioActual() usuario?: PayloadJwt,
  ) {
    return this.archivosService.listarImagenesDeMascota(mascotaId, usuario);
  }

  // GET /archivos/descargar/:id?expira=&firma=: público, protegido por la firma. Va antes de /:id/url_firmada.
  @Get('descargar/:id')
  @ApiProduces('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  async descargar(@Param('id', ParseIntPipe) id: number, @Query() consulta: DescargarArchivoDto): Promise<StreamableFile> {
    const { contenido, tipoMime, clave } = await this.archivosService.descargar(id, consulta.expira, consulta.firma);
    // Se usa la clave (UUID) como nombre: nunca el nombre original en una cabecera.
    return new StreamableFile(contenido, { type: tipoMime, disposition: `inline; filename="${clave}"` });
  }

  // GET /archivos/:id/url_firmada → { url, expiraEn }
  @Get(':id/url_firmada')
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard)
  obtenerUrlFirmada(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: PayloadJwt) {
    return this.archivosService.obtenerUrlFirmada(id, usuario);
  }

  // DELETE /archivos/:id: quien lo subió o un administrador.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(AutenticadoGuard)
  async eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: PayloadJwt): Promise<void> {
    await this.archivosService.eliminar(id, usuario);
  }
}
