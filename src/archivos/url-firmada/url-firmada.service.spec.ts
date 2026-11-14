import { UrlFirmadaService } from './url-firmada.service';

// Secreto de ejemplo solo para pruebas.
const SECRETO_DE_PRUEBA = 'secreto-de-prueba-solo-para-tests-unitarios';
const EXPIRA_SEGUNDOS = 300;
const AHORA = new Date('2026-01-01T12:00:00Z');

function segundosDespues(fecha: Date, segundos: number): Date {
  return new Date(fecha.getTime() + segundos * 1000);
}

describe('UrlFirmadaService', () => {
  const servicio = new UrlFirmadaService({ secreto: SECRETO_DE_PRUEBA, expiraSegundos: EXPIRA_SEGUNDOS });

  it('firma con una expiración igual a ahora más la vigencia configurada', () => {
    const { expira } = servicio.firmar(7, AHORA);

    expect(expira).toBe(Math.floor(AHORA.getTime() / 1000) + EXPIRA_SEGUNDOS);
  });

  it('acepta una firma válida dentro de su vigencia', () => {
    const { expira, firma } = servicio.firmar(7, AHORA);

    expect(servicio.verificar(7, expira, firma, segundosDespues(AHORA, EXPIRA_SEGUNDOS - 1))).toBe(true);
  });

  it('rechaza una firma expirada', () => {
    const { expira, firma } = servicio.firmar(7, AHORA);

    expect(servicio.verificar(7, expira, firma, segundosDespues(AHORA, EXPIRA_SEGUNDOS + 1))).toBe(false);
  });

  it('rechaza una firma alterada', () => {
    const { expira, firma } = servicio.firmar(7, AHORA);
    const alterada = `${firma[0] === 'A' ? 'B' : 'A'}${firma.slice(1)}`;

    expect(servicio.verificar(7, expira, alterada, AHORA)).toBe(false);
  });

  it('rechaza una firma con distinta longitud sin lanzar error', () => {
    const { expira, firma } = servicio.firmar(7, AHORA);

    expect(servicio.verificar(7, expira, `${firma}x`, AHORA)).toBe(false);
    expect(servicio.verificar(7, expira, '', AHORA)).toBe(false);
  });

  it('rechaza una expiración modificada para alargar la vigencia', () => {
    const { expira, firma } = servicio.firmar(7, AHORA);

    expect(servicio.verificar(7, expira + 3600, firma, AHORA)).toBe(false);
  });

  it('rechaza la firma de otro archivo', () => {
    const { expira, firma } = servicio.firmar(7, AHORA);

    expect(servicio.verificar(8, expira, firma, AHORA)).toBe(false);
  });

  it('rechaza firmas hechas con otro secreto', () => {
    const otro = new UrlFirmadaService({ secreto: `${SECRETO_DE_PRUEBA}-distinto`, expiraSegundos: EXPIRA_SEGUNDOS });
    const { expira, firma } = otro.firmar(7, AHORA);

    expect(servicio.verificar(7, expira, firma, AHORA)).toBe(false);
  });

  it('lanza un error si el secreto tiene menos de 32 caracteres', () => {
    expect(() => new UrlFirmadaService({ secreto: 'corto', expiraSegundos: EXPIRA_SEGUNDOS })).toThrow(
      /al menos 32 caracteres/,
    );
  });

  it('lanza un error si la vigencia no es un entero positivo', () => {
    expect(() => new UrlFirmadaService({ secreto: SECRETO_DE_PRUEBA, expiraSegundos: 0 })).toThrow();
  });
});
