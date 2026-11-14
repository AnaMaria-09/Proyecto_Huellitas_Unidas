import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const RONDAS_BCRYPT = 10;

@Injectable()
export class ContrasenasService {
  async hashear(contrasena: string): Promise<string> {
    return bcrypt.hash(contrasena, RONDAS_BCRYPT);
  }

  async coincide(contrasena: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contrasena, hash);
  }
}
