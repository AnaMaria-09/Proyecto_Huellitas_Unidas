import { api, API } from './soporte/api-e2e';

describe('Salud (e2e)', () => {
  it('GET /salud responde 200 con la base de datos arriba', async () => {
    const respuesta = await api().get(`${API}/salud`).expect(200);

    expect(respuesta.body).toMatchObject({ status: 'ok', info: { baseDeDatos: { status: 'up' } } });
  });

  it('la raíz ya no tiene el saludo de la plantilla', async () => {
    await api().get(`${API}`).expect(404);
  });
});
