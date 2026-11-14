import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ContrasenasService } from './contrasenas.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import { PayloadJwt, sinPasswordHash, UsuarioPublico } from './usuario.model';

const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usuariosRepositorio: UsuariosRepositorio,
    private readonly contrasenas: ContrasenasService,
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

  async iniciarSesion(datos: IniciarSesionDto): Promise<{ accessToken: string }> {
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

    const payload: PayloadJwt = { sub: usuario.id, rol: usuario.rol, email: usuario.email };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
    return { accessToken };
  }
}
