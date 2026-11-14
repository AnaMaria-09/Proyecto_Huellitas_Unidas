import { duracionEnMs, duracionEnSegundos } from './duracion';

describe('duracion', () => {
  it('convierte segundos, minutos, horas y días', () => {
    expect(duracionEnMs('30s')).toBe(30_000);
    expect(duracionEnMs('15m')).toBe(900_000);
    expect(duracionEnMs('12h')).toBe(43_200_000);
    expect(duracionEnSegundos('7d')).toBe(604_800);
  });

  it('rechaza formatos que no reconoce', () => {
    expect(() => duracionEnMs('15')).toThrow(/Duración inválida/);
    expect(() => duracionEnMs('1w')).toThrow(/Duración inválida/);
    expect(() => duracionEnMs('m15')).toThrow(/Duración inválida/);
  });
});
