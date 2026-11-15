import {
  api,
  API,
  autorizacion,
  CLAVE,
  crearMascota,
  limpiarBase,
  MENSAJE,
  PNG,
  registrar,
  sesionAdmin,
  verificarFundacion,
} from './soporte/api-e2e';
import type { Sesion } from './soporte/api-e2e';

const PASSWORD = /password/i;

describe('Seguridad (e2e)', () => {
  let admin: Sesion;
  let fundacion: Sesion;
  let ciudadano: Sesion;
  let mascotaId: number;

  beforeAll(async () => {
    await limpiarBase();
    admin = await sesionAdmin();
    fundacion = await registrar('fundacion');
    await verificarFundacion(admin, fundacion);
    ciudadano = await registrar('ciudadano');
    mascotaId = await crearMascota(fundacion);
  });

  describe('401 sin sesión', () => {
    it.each([
      ['GET', '/usuarios/perfil'],
      ['GET', '/adopciones/mis_solicitudes'],
      ['POST', '/mascotas'],
      ['POST', '/adopciones'],
      ['DELETE', '/archivos/1'],
    ])('%s %s sin token', async (metodo, ruta) => {
      const peticion =
        metodo === 'GET'
          ? api().get(API + ruta)
          : metodo === 'POST'
            ? api().post(API + ruta)
            : api().delete(API + ruta);
      await peticion.expect(401);
    });

    it('con un token alterado', async () => {
      await api()
        .get(`${API}/usuarios/perfil`)
        .set('Authorization', `Bearer ${ciudadano.token}x`)
        .expect(401);
    });
  });

  describe('403 por rol', () => {
    it('un ciudadano no puede publicar mascotas', async () => {
      await api()
        .post(`${API}/mascotas`)
        .set(...autorizacion(ciudadano))
        .send({
          nombre: 'Max',
          especie: 'perro',
          tamano: 'grande',
          edadMeses: 3,
          sexo: 'macho',
          ciudad: 'Cali',
        })
        .expect(403);
    });

    it('una fundación no puede solicitar adopciones', async () => {
      await api()
        .post(`${API}/adopciones`)
        .set(...autorizacion(fundacion))
        .send({ mascotaId, mensaje: MENSAJE })
        .expect(403);
    });

    it('solo el administrador lista usuarios y verifica fundaciones', async () => {
      await api()
        .get(`${API}/usuarios`)
        .set(...autorizacion(ciudadano))
        .expect(403);
      await api()
        .patch(`${API}/fundaciones/${fundacion.id}/verificacion`)
        .set(...autorizacion(fundacion))
        .send({ verificada: true })
        .expect(403);
    });

    it('una fundación sin verificar no puede publicar mascotas', async () => {
      const sinVerificar = await registrar('fundacion');

      const respuesta = await api()
        .post(`${API}/mascotas`)
        .set(...autorizacion(sinVerificar))
        .send({
          nombre: 'Max',
          especie: 'perro',
          tamano: 'grande',
          edadMeses: 3,
          sexo: 'macho',
          ciudad: 'Cali',
        })
        .expect(403);
      expect(respuesta.body.message).toMatch(/no está verificada/);
    });

    it('el registro público no permite crear administradores', async () => {
      await api()
        .post(`${API}/autenticacion/registro`)
        .send({
          nombre: 'Intruso',
          email: 'intruso@e2e.test',
          password: CLAVE,
          rol: 'administrador',
        })
        .expect(400);
    });
  });

  describe('nunca se devuelve passwordHash', () => {
    it('ni al registrarse ni en el perfil ni en los listados del administrador', async () => {
      const registro = await api()
        .post(`${API}/autenticacion/registro`)
        .send({
          nombre: 'Carla Ruiz',
          email: 'carla@e2e.test',
          password: CLAVE,
          rol: 'ciudadano',
        })
        .expect(201);
      const perfil = await api()
        .get(`${API}/usuarios/perfil`)
        .set(...autorizacion(ciudadano))
        .expect(200);
      const usuarios = await api()
        .get(`${API}/usuarios`)
        .set(...autorizacion(admin))
        .expect(200);
      const fundacionPublica = await api()
        .get(`${API}/fundaciones/${fundacion.id}`)
        .expect(200);

      for (const respuesta of [registro, perfil, usuarios, fundacionPublica]) {
        expect(respuesta.text).not.toMatch(PASSWORD);
      }
      expect(usuarios.body.datos.length).toBeGreaterThan(0);
    });

    it('ni en las solicitudes que ve la fundación', async () => {
      const solicitud = await api()
        .post(`${API}/adopciones`)
        .set(...autorizacion(ciudadano))
        .send({ mascotaId, mensaje: MENSAJE })
        .expect(201);
      const recibidas = await api()
        .get(`${API}/adopciones/recibidas`)
        .set(...autorizacion(fundacion))
        .expect(200);
      const detalle = await api()
        .get(`${API}/adopciones/${solicitud.body.id}`)
        .set(...autorizacion(fundacion))
        .expect(200);

      expect(recibidas.text).not.toMatch(PASSWORD);
      expect(detalle.text).not.toMatch(PASSWORD);
      expect(detalle.body.adoptante).toEqual({
        id: ciudadano.id,
        nombre: 'Ana Pérez',
        email: ciudadano.email,
      });
    });
  });

  describe('solicitudes ajenas', () => {
    it('otro ciudadano recibe 404 al ver o cancelar una solicitud que no es suya', async () => {
      const otro = await registrar('ciudadano', 'Luis Gómez');
      const mascota = await crearMascota(fundacion, { nombre: 'Kira' });
      const solicitud = await api()
        .post(`${API}/adopciones`)
        .set(...autorizacion(ciudadano))
        .send({ mascotaId: mascota, mensaje: MENSAJE })
        .expect(201);

      await api()
        .get(`${API}/adopciones/${solicitud.body.id}`)
        .set(...autorizacion(otro))
        .expect(404);
      await api()
        .delete(`${API}/adopciones/${solicitud.body.id}`)
        .set(...autorizacion(otro))
        .expect(404);
    });
  });

  describe('URLs firmadas', () => {
    let url: string;

    beforeAll(async () => {
      const subida = await api()
        .post(`${API}/archivos/imagenes`)
        .set(...autorizacion(fundacion))
        .field('mascotaId', String(mascotaId))
        .attach('imagenes', PNG, {
          filename: 'foto.png',
          contentType: 'image/png',
        })
        .expect(201);
      url = subida.body[0].url;
    });

    it('la URL sin cambios descarga el archivo', async () => {
      await api().get(url).expect(200);
    });

    it('una firma alterada devuelve 403', async () => {
      const alterada = url.replace(
        /firma=(.)/,
        (_coincidencia, primera: string) =>
          `firma=${primera === 'A' ? 'B' : 'A'}`,
      );
      const respuesta = await api().get(alterada).expect(403);
      expect(respuesta.body.message).toBe(
        'El enlace de descarga no es válido o ya expiró',
      );
    });

    it('cambiar la expiración invalida la firma', async () => {
      const extendida = url.replace(
        /expira=\d+/,
        `expira=${Math.floor(Date.now() / 1000) + 86_400}`,
      );
      await api().get(extendida).expect(403);
    });
  });

  describe('refresh token', () => {
    it('un refresh token ya usado devuelve 401', async () => {
      const sesion = await registrar('ciudadano');

      const nuevo = await api()
        .post(`${API}/autenticacion/refrescar_token`)
        .send({ refreshToken: sesion.refreshToken })
        .expect(200);
      expect(nuevo.body.refreshToken).not.toBe(sesion.refreshToken);

      await api()
        .post(`${API}/autenticacion/refrescar_token`)
        .send({ refreshToken: sesion.refreshToken })
        .expect(401);
    });

    it('después de cerrar sesión el refresh token ya no sirve', async () => {
      const sesion = await registrar('ciudadano');

      await api()
        .post(`${API}/autenticacion/cerrar_sesion`)
        .set(...autorizacion(sesion))
        .send({ refreshToken: sesion.refreshToken })
        .expect(204);

      await api()
        .post(`${API}/autenticacion/refrescar_token`)
        .send({ refreshToken: sesion.refreshToken })
        .expect(401);
    });
  });
});
