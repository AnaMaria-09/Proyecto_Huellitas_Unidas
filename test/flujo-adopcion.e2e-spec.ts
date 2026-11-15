import {
  api,
  API,
  autorizacion,
  crearMascota,
  limpiarBase,
  MENSAJE,
  PNG,
  registrar,
  sesionAdmin,
  verificarFundacion,
} from './soporte/api-e2e';
import type { Sesion } from './soporte/api-e2e';

// Recorre el flujo completo de una adopción. Cada paso depende del anterior.
describe('Flujo de adopción (e2e)', () => {
  let admin: Sesion;
  let fundacion: Sesion;
  let ana: Sesion;
  let luis: Sesion;
  let mascotaId: number;
  let solicitudAna: number;
  let solicitudLuis: number;

  beforeAll(async () => {
    await limpiarBase();
    admin = await sesionAdmin();
    fundacion = await registrar('fundacion');
    ana = await registrar('ciudadano', 'Ana Pérez');
    luis = await registrar('ciudadano', 'Luis Gómez');
  });

  async function estadoMascota(): Promise<string> {
    const respuesta = await api()
      .get(`${API}/mascotas/${mascotaId}`)
      .expect(200);
    return respuesta.body.estado;
  }

  it('la fundación sin verificar no puede publicar mascotas', async () => {
    const respuesta = await api()
      .post(`${API}/mascotas`)
      .set(...autorizacion(fundacion))
      .send({
        nombre: 'Luna',
        especie: 'gato',
        tamano: 'pequeno',
        edadMeses: 12,
        sexo: 'hembra',
        ciudad: 'Bogotá',
      })
      .expect(403);
    expect(respuesta.body.message).toMatch(/no está verificada/);
  });

  it('el administrador verifica la fundación y ella publica una mascota disponible', async () => {
    await verificarFundacion(admin, fundacion);
    mascotaId = await crearMascota(fundacion);

    expect(await estadoMascota()).toBe('disponible');
  });

  it('la fundación sube una foto PNG y cualquiera puede descargarla con la URL firmada', async () => {
    const subida = await api()
      .post(`${API}/archivos/imagenes`)
      .set(...autorizacion(fundacion))
      .field('mascotaId', String(mascotaId))
      .attach('imagenes', PNG, {
        filename: 'luna.png',
        contentType: 'image/png',
      })
      .expect(201);
    expect(subida.body).toHaveLength(1);
    expect(subida.body[0]).toMatchObject({
      nombreOriginal: 'luna.png',
      tipoMime: 'image/png',
      tipo: 'imagen',
    });

    const listado = await api()
      .get(`${API}/archivos/mascota/${mascotaId}`)
      .expect(200);
    expect(listado.body).toHaveLength(1);

    const descarga = await api()
      .get(subida.body[0].url)
      .buffer(true)
      .expect(200);
    expect(descarga.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(descarga.body as Buffer, PNG)).toBe(0);
  });

  it('dos ciudadanos solicitan adoptar la misma mascota', async () => {
    const deAna = await api()
      .post(`${API}/adopciones`)
      .set(...autorizacion(ana))
      .send({ mascotaId, mensaje: MENSAJE })
      .expect(201);
    const deLuis = await api()
      .post(`${API}/adopciones`)
      .set(...autorizacion(luis))
      .send({ mascotaId, mensaje: MENSAJE })
      .expect(201);
    solicitudAna = deAna.body.id;
    solicitudLuis = deLuis.body.id;

    expect(deAna.body).toMatchObject({
      estado: 'pendiente',
      adoptanteId: ana.id,
    });
    const recibidas = await api()
      .get(`${API}/adopciones/recibidas?estado=pendiente`)
      .set(...autorizacion(fundacion))
      .expect(200);
    expect(recibidas.body.total).toBe(2);
    expect(Object.keys(recibidas.body.datos[0].adoptante).sort()).toEqual([
      'email',
      'id',
      'nombre',
    ]);
  });

  it('al aprobar la de Ana, la mascota queda en proceso y la de Luis se rechaza sola', async () => {
    const aprobada = await api()
      .patch(`${API}/adopciones/${solicitudAna}/evaluacion`)
      .set(...autorizacion(fundacion))
      .send({
        decision: 'aprobada',
        observaciones: 'Visita domiciliaria aprobada',
      })
      .expect(200);
    expect(aprobada.body.estado).toBe('aprobada');
    expect(await estadoMascota()).toBe('en_proceso');

    const deLuis = await api()
      .get(`${API}/adopciones/${solicitudLuis}`)
      .set(...autorizacion(luis))
      .expect(200);
    expect(deLuis.body).toMatchObject({
      estado: 'rechazada',
      motivoRechazo: 'La mascota fue asignada a otra solicitud',
    });

    const historialLuis = await api()
      .get(`${API}/adopciones/${solicitudLuis}/historial`)
      .set(...autorizacion(luis))
      .expect(200);
    expect(
      historialLuis.body.map(
        (registro: { estadoNuevo: string }) => registro.estadoNuevo,
      ),
    ).toEqual(['pendiente', 'rechazada']);

    const disponibles = await api().get(`${API}/mascotas`).expect(200);
    expect(
      disponibles.body.datos.map((mascota: { id: number }) => mascota.id),
    ).not.toContain(mascotaId);
  });

  it('nadie más puede solicitar la mascota mientras está en proceso', async () => {
    await api()
      .post(`${API}/adopciones`)
      .set(...autorizacion(luis))
      .send({ mascotaId, mensaje: MENSAJE })
      .expect(409);
  });

  it('al confirmar la entrega la solicitud se completa y la mascota queda adoptada', async () => {
    const completada = await api()
      .patch(`${API}/adopciones/${solicitudAna}/confirmar_entrega`)
      .set(...autorizacion(fundacion))
      .send({ fechaEntrega: new Date(Date.now() - 60_000).toISOString() })
      .expect(200);
    expect(completada.body.estado).toBe('completada');
    expect(await estadoMascota()).toBe('adoptada');

    await api()
      .delete(`${API}/adopciones/${solicitudAna}`)
      .set(...autorizacion(ana))
      .expect(409);
  });

  it('el historial de Ana muestra cada cambio, en orden y con quién lo hizo', async () => {
    const historial = await api()
      .get(`${API}/adopciones/${solicitudAna}/historial`)
      .set(...autorizacion(ana))
      .expect(200);

    expect(
      historial.body.map(
        (registro: {
          estadoAnterior: string | null;
          estadoNuevo: string;
          usuarioId: number;
        }) => [
          registro.estadoAnterior,
          registro.estadoNuevo,
          registro.usuarioId,
        ],
      ),
    ).toEqual([
      [null, 'pendiente', ana.id],
      ['pendiente', 'aprobada', fundacion.id],
      ['aprobada', 'completada', fundacion.id],
    ]);

    const mias = await api()
      .get(`${API}/adopciones/mis_solicitudes`)
      .set(...autorizacion(ana))
      .expect(200);
    expect(mias.body).toMatchObject({
      total: 1,
      datos: [{ id: solicitudAna, estado: 'completada' }],
    });
  });

  it('cancelar una solicitud aprobada devuelve la mascota a disponible', async () => {
    const otraMascota = await crearMascota(fundacion, {
      nombre: 'Max',
      especie: 'perro',
      tamano: 'grande',
    });
    const solicitud = await api()
      .post(`${API}/adopciones`)
      .set(...autorizacion(luis))
      .send({ mascotaId: otraMascota, mensaje: MENSAJE })
      .expect(201);
    await api()
      .patch(`${API}/adopciones/${solicitud.body.id}/evaluacion`)
      .set(...autorizacion(fundacion))
      .send({ decision: 'aprobada' })
      .expect(200);

    await api()
      .delete(`${API}/adopciones/${solicitud.body.id}`)
      .set(...autorizacion(luis))
      .expect(204);

    const cancelada = await api()
      .get(`${API}/adopciones/${solicitud.body.id}`)
      .set(...autorizacion(luis))
      .expect(200);
    expect(cancelada.body.estado).toBe('cancelada');
    const mascota = await api()
      .get(`${API}/mascotas/${otraMascota}`)
      .expect(200);
    expect(mascota.body.estado).toBe('disponible');
  });
});
