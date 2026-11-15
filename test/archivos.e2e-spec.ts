import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  api,
  API,
  autorizacion,
  crearMascota,
  limpiarBase,
  PNG,
  registrar,
  sesionAdmin,
  verificarFundacion,
} from './soporte/api-e2e';
import type { Sesion } from './soporte/api-e2e';

// La API de pruebas corre en la raíz del proyecto, así que ALMACENAMIENTO_DIR es relativo a ella.
function enDisco(clave: string): boolean {
  return existsSync(join(process.env.ALMACENAMIENTO_DIR ?? 'uploads', clave));
}

describe('Archivos (e2e)', () => {
  let fundacion: Sesion;

  beforeAll(async () => {
    await limpiarBase();
    const admin = await sesionAdmin();
    fundacion = await registrar('fundacion');
    await verificarFundacion(admin, fundacion);
  });

  it('al eliminar una mascota también se borran sus imágenes del disco', async () => {
    const mascotaId = await crearMascota(fundacion);
    const subida = await api()
      .post(`${API}/archivos/imagenes`)
      .set(...autorizacion(fundacion))
      .field('mascotaId', String(mascotaId))
      .attach('imagenes', PNG, {
        filename: 'uno.png',
        contentType: 'image/png',
      })
      .attach('imagenes', PNG, {
        filename: 'dos.png',
        contentType: 'image/png',
      })
      .expect(201);
    const archivos: { id: number; clave: string }[] = subida.body;
    expect(archivos.every(({ clave }) => enDisco(clave))).toBe(true);

    await api()
      .delete(`${API}/mascotas/${mascotaId}`)
      .set(...autorizacion(fundacion))
      .expect(204);

    for (const { id, clave } of archivos) {
      expect(enDisco(clave)).toBe(false);
      await api()
        .get(`${API}/archivos/${id}/url_firmada`)
        .set(...autorizacion(fundacion))
        .expect(404);
    }
  });

  it('las imágenes de otras mascotas no se tocan', async () => {
    const conservada = await crearMascota(fundacion, { nombre: 'Kira' });
    const eliminada = await crearMascota(fundacion, { nombre: 'Max' });
    const subida = await api()
      .post(`${API}/archivos/imagenes`)
      .set(...autorizacion(fundacion))
      .field('mascotaId', String(conservada))
      .attach('imagenes', PNG, {
        filename: 'kira.png',
        contentType: 'image/png',
      })
      .expect(201);

    await api()
      .delete(`${API}/mascotas/${eliminada}`)
      .set(...autorizacion(fundacion))
      .expect(204);

    expect(enDisco(subida.body[0].clave)).toBe(true);
    const listado = await api()
      .get(`${API}/archivos/mascota/${conservada}`)
      .expect(200);
    expect(listado.body).toHaveLength(1);
  });
});
