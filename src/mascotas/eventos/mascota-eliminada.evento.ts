// Se emite después de borrar una mascota. Otros módulos (archivos) lo escuchan para limpiar
// lo que dependía de ella, sin que mascotas tenga que conocerlos.
export const MASCOTA_ELIMINADA = 'mascota.eliminada';

export class MascotaEliminadaEvento {
  constructor(readonly mascotaId: number) {}
}
