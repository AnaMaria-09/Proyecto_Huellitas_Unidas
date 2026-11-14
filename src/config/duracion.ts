// Duraciones de configuración como "30s", "15m", "12h" o "7d".
export const PATRON_DURACION = /^(\d+)([smhd])$/;

const MS_POR_UNIDAD: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function duracionEnMs(valor: string): number {
  const coincidencia = PATRON_DURACION.exec(valor);
  if (!coincidencia) {
    throw new Error(`Duración inválida: "${valor}". Usa un número seguido de s, m, h o d (por ejemplo 15m)`);
  }
  return Number(coincidencia[1]) * MS_POR_UNIDAD[coincidencia[2]];
}

export function duracionEnSegundos(valor: string): number {
  return Math.floor(duracionEnMs(valor) / 1_000);
}
