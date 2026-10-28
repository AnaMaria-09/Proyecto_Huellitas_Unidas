import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import { obtenerJwtSecreto } from './jwt-secreto';
import { PayloadJwt, Usuario, UsuarioPublico } from './usuario.model';

const RONDAS_BCRYPT = 10;
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

// TODO: el almacenamiento en memoria se reemplazará por TypeORM (repositorio de Usuario).
@Injectable()
export class AutenticacionService {
  private usuarios: Usuario[] = [];
  private siguienteId = 1;
  private readonly jwtSecreto: string;

  constructor(private readonly jwtService: JwtService) {
    // Falla al arrancar si JWT_SECRET no está definido.
    this.jwtSecreto = obtenerJwtSecreto();
  }

  async registrar(datos: RegistroDto): Promise<UsuarioPublico> {
    const email = datos.email.toLowerCase();
    if (this.buscarPorEmail(email)) {
      throw new ConflictException('El email ya está registrado');
    }

    const usuario: Usuario = {
      id: this.siguienteId++,
      nombre: datos.nombre,
      email,
      passwordHash: await bcrypt.hash(datos.password, RONDAS_BCRYPT),
      rol: datos.rol,
      estado: 'activo',
      creadoEn: new Date(),
    };
    this.usuarios.push(usuario);
    return this.sinPasswordHash(usuario);
  }

  async iniciarSesion(datos: IniciarSesionDto): Promise<{ accessToken: string }> {
    const usuario = this.buscarPorEmail(datos.email.toLowerCase());
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

  private buscarPorEmail(email: string): Usuario | undefined {
    return this.usuarios.find((u) => u.email === email);
  }

  private sinPasswordHash(usuario: Usuario): UsuarioPublico {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...publico } = usuario;
    return publico;
  }
}
