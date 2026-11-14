import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CambiarContrasenaDto } from './cambiar-contrasena.dto';

function errores(datos: object): string[] {
  return validateSync(plainToInstance(CambiarContrasenaDto, datos)).flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('CambiarContrasenaDto', () => {
  it('acepta una contraseña nueva de 8 a 64 caracteres distinta de la actual', () => {
    expect(errores({ contrasenaActual: 'secreta123', contrasenaNueva: 'nueva-secreta456' })).toEqual([]);
  });

  it('rechaza una contraseña nueva igual a la actual', () => {
    expect(errores({ contrasenaActual: 'secreta123', contrasenaNueva: 'secreta123' })).toEqual([
      'La contraseña nueva debe ser distinta de la actual',
    ]);
  });

  it('rechaza una contraseña nueva de menos de 8 o más de 64 caracteres', () => {
    expect(errores({ contrasenaActual: 'secreta123', contrasenaNueva: 'corta' })).toHaveLength(1);
    expect(errores({ contrasenaActual: 'secreta123', contrasenaNueva: 'x'.repeat(65) })).toHaveLength(1);
  });
});
