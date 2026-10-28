import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import { obtenerJwtSecreto } from './jwt-secreto';
import { PayloadJwt, sinPasswordHash, UsuarioPublico } from './usuario.model';

const RONDAS_BCRYPT = 10;
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

@Injectable()
export class AutenticacionService {
  private readonly jwtSecreto: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usuariosRepositorio: UsuariosRepositorio,
  ) {
    // Falla al arrancar si JWT_SECRET no está definido.
    this.jwtSecreto = obtenerJwtSecreto();
  }

  async registrar(datos: RegistroDto): Promise<UsuarioPublico> {
    const email = datos.email.toLowerCase();
    if (this.usuariosRepositorio.buscarPorEmail(email)) {
      throw new ConflictException('El email ya está registrado');
    }

    const usuario = this.usuariosRepositorio.guardar({
      nombre: datos.nombre,
      email,
      passwordHash: await bcrypt.hash(datos.password, RONDAS_BCRYPT),
      rol: datos.rol,
      estado: 'activo',
      creadoEn: new Date(),
    });
    return sinPasswordHash(usuario);
  }

  async iniciarSesion(datos: IniciarSesionDto): Promise<{ accessToken: string }> {
    const usuario = this.usuariosRepositorio.buscarPorEmail(datos.email);
    const passwordValida = usuario
      ? await bcrypt.compare(datos.password, usuario.passwordHash)
      : false;
    if (!usuario || !passwordValida) {
      throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
    }

    const payload: PayloadJwt = { sub: usuario.id, rol: usuario.rol, email: usuario.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecreto,
      expiresIn: '1h',
    });
    return { accessToken };
  }
}
