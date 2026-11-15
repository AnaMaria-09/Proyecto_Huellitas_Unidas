import {
  api,
  API,
  autorizacion,
  crearMascota,
  limpiarBase,
  MENSAJE,
  registrar,
  sesionAdmin,
  verificarFundacion,
} from './soporte/api-e2e';
import type { Sesion } from './soporte/api-e2e';

// El ValidationPipe global responde 400 con un mensaje en español por cada regla que falla.
describe('Validación (e2e)', () => {
  let fundacion: Sesion;
  let ciudadano: Sesion;
  let mascotaId: number;

  beforeAll(async () => {
    await limpiarBase();
    const admin = await sesionAdmin();
    fundacion = await registrar('fundacion');
    await verificarFundacion(admin, fundacion);
    ciudadano = await registrar('ciudadano');
    mascotaId = await crearMascota(fundacion);
  });

  it('registro: un mensaje por cada campo inválido', async () => {
    const respuesta = await api()
      .post(`${API}/autenticacion/registro`)
      .send({
        nombre: 'A',
        email: 'no-es-email',
        password: 'corta',
        rol: 'administrador',
      })
      .expect(400);

    expect(respuesta.body.message).toEqual(
      expect.arrayContaining([
        'El nombre debe tener entre 2 y 80 caracteres',
        'El email no es válido',
        'La contraseña debe tener entre 8 y 64 caracteres',
        "El rol debe ser 'ciudadano' o 'fundacion'",
      ]),
    );
  });

  it('registro: cuerpo vacío', async () => {
    const respuesta = await api()
      .post(`${API}/autenticacion/registro`)
      .send({})
      .expect(400);

    expect(respuesta.body.message).toEqual(
      expect.arrayContaining([
        'El nombre es obligatorio',
        'El email no es válido',
        "El rol debe ser 'ciudadano' o 'fundacion'",
      ]),
    );
  });

  it('mascotas: valores fuera de los permitidos', async () => {
    const respuesta = await api()
      .post(`${API}/mascotas`)
      .set(...autorizacion(fundacion))
      .send({
        nombre: '',
        especie: 'dragon',
        tamano: 'enorme',
        edadMeses: -1,
        sexo: 'x',
        ciudad: '',
      })
      .expect(400);

    expect(respuesta.body.message).toEqual(
      expect.arrayContaining([
        'El nombre es obligatorio',
        'La especie debe ser una de: perro, gato, otro',
        'El tamaño debe ser uno de: pequeno, mediano, grande',
        'edadMeses no puede ser negativa',
        'El sexo debe ser uno de: macho, hembra, desconocido',
        'La ciudad es obligatoria',
      ]),
    );
  });

  it('adopciones: mascotaId y mensaje inválidos', async () => {
    const respuesta = await api()
      .post(`${API}/adopciones`)
      .set(...autorizacion(ciudadano))
      .send({ mascotaId: 'tres', mensaje: 'Lo quiero' })
      .expect(400);

    expect(respuesta.body.message).toEqual(
      expect.arrayContaining([
        'mascotaId debe ser un número entero',
        'El mensaje debe tener entre 20 y 1000 caracteres',
      ]),
    );
  });

  describe('evaluación y entrega', () => {
    let solicitudId: number;

    beforeAll(async () => {
      const solicitud = await api()
        .post(`${API}/adopciones`)
        .set(...autorizacion(ciudadano))
        .send({ mascotaId, mensaje: MENSAJE })
        .expect(201);
      solicitudId = solicitud.body.id;
    });

    it('rechazar sin motivo', async () => {
      const respuesta = await api()
        .patch(`${API}/adopciones/${solicitudId}/evaluacion`)
        .set(...autorizacion(fundacion))
        .send({ decision: 'rechazada' })
        .expect(400);

      expect(respuesta.body.message).toContain(
        'El motivo es obligatorio al rechazar una solicitud',
      );
    });

    it('una decisión desconocida', async () => {
      const respuesta = await api()
        .patch(`${API}/adopciones/${solicitudId}/evaluacion`)
        .set(...autorizacion(fundacion))
        .send({ decision: 'quizas' })
        .expect(400);

      expect(respuesta.body.message).toContain(
        "La decisión debe ser 'aprobada' o 'rechazada'",
      );
    });

    it('una fecha de entrega futura o que no es fecha', async () => {
      const futura = await api()
        .patch(`${API}/adopciones/${solicitudId}/confirmar_entrega`)
        .set(...autorizacion(fundacion))
        .send({ fechaEntrega: new Date(Date.now() + 86_400_000).toISOString() })
        .expect(400);
      const noFecha = await api()
        .patch(`${API}/adopciones/${solicitudId}/confirmar_entrega`)
        .set(...autorizacion(fundacion))
        .send({ fechaEntrega: 'ayer' })
        .expect(400);

      expect(futura.body.message).toContain(
        'La fecha de entrega no puede ser futura',
      );
      expect(noFecha.body.message).toContain(
        'fechaEntrega debe ser una fecha válida en formato ISO 8601',
      );
    });

    it('la solicitud no cambió con las peticiones inválidas', async () => {
      const solicitud = await api()
        .get(`${API}/adopciones/${solicitudId}`)
        .set(...autorizacion(ciudadano))
        .expect(200);
      expect(solicitud.body.estado).toBe('pendiente');
    });
  });

  it('un estado desconocido en el filtro de listados', async () => {
    const respuesta = await api()
      .get(`${API}/adopciones/mis_solicitudes?estado=archivada`)
      .set(...autorizacion(ciudadano))
      .expect(400);

    expect(respuesta.body.message[0]).toMatch(/^El estado debe ser uno de:/);
  });

  it('archivos: subir imágenes sin archivos', async () => {
    const respuesta = await api()
      .post(`${API}/archivos/imagenes`)
      .set(...autorizacion(fundacion))
      .field('mascotaId', String(mascotaId))
      .expect(400);

    expect(
      typeof respuesta.body.message === 'string'
        ? respuesta.body.message
        : respuesta.body.message[0],
    ).toMatch(/imagen/i);
  });
});
