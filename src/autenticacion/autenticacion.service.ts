import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ContrasenasService } from './contrasenas.service';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { CerrarSesionDto } from './dto/cerrar-sesion.dto';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RefrescarTokenDto } from './dto/refrescar-token.dto';
import { RegistroDto } from './dto/registro.dto';
import { ParTokens, TokensService } from './tokens.service';
import { sinPasswordHash, UsuarioPublico } from './usuario.model';

const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosRepositorio: UsuariosRepositorio,
    private readonly contrasenas: ContrasenasService,
    private readonly tokens: TokensService,
  ) {}

  async registrar(datos: RegistroDto): Promise<UsuarioPublico> {
    if (await this.usuariosRepositorio.buscarPorEmail(datos.email)) {
      throw new ConflictException('El email ya está registrado');
    }

    const usuario = await this.usuariosRepositorio.guardar({
      nombre: datos.nombre,
      email: datos.email,
      passwordHash: await this.contrasenas.hashear(datos.password),
      rol: datos.rol,
    });
    return sinPasswordHash(usuario);
  }

  async iniciarSesion(datos: IniciarSesionDto): Promise<ParTokens> {
    const usuario = await this.usuariosRepositorio.buscarPorEmailConPassword(datos.email);
    const passwordValida = usuario
      ? await this.contrasenas.coincide(datos.password, usuario.passwordHash)
      : false;
    if (!usuario || !passwordValida) {
      throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
    }
    // Se revisa después de la contraseña para no revelar el estado de la cuenta a quien no la conoce.
    if (usuario.estado === 'inactivo') {
      throw new ForbiddenException('La cuenta está desactivada');
    }

    return this.tokens.emitir(usuario);
  }

  async refrescarToken(datos: RefrescarTokenDto): Promise<ParTokens> {
    return this.tokens.rotar(datos.refreshToken);
  }

  async cerrarSesion(usuarioId: number, datos: CerrarSesionDto): Promise<void> {
    await this.tokens.revocar(datos.refreshToken, usuarioId);
  }

  // Tras cambiarla se revocan todos los refresh tokens: las demás sesiones tienen que volver a entrar.
  async cambiarContrasena(usuarioId: number, datos: CambiarContrasenaDto): Promise<void> {
    const usuario = await this.usuariosRepositorio.buscarPorIdConPassword(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${usuarioId} no encontrado`);
    }
    if (!(await this.contrasenas.coincide(datos.contrasenaActual, usuario.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    await this.usuariosRepositorio.actualizarPasswordHash(usuarioId, await this.contrasenas.hashear(datos.contrasenaNueva));
    await this.tokens.revocarTodos(usuarioId);
  }
}
