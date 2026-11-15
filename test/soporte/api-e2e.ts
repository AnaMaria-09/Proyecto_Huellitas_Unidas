import request from 'supertest';
import { DataSource } from 'typeorm';

// Utilidades de las pruebas e2e. La API ya está corriendo (ver iniciar-servidor.ts).

export const API = '/api/v1';
export const CLAVE = 'clave-segura-123';
export const MENSAJE =
  'Tengo un patio grande y mucho tiempo para cuidarla bien.';
export const MASCOTA = {
  nombre: 'Luna',
  especie: 'gato',
  tamano: 'pequeno',
  edadMeses: 12,
  sexo: 'hembra',
  ciudad: 'Bogotá',
};

// PNG de 1x1 píxel.
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export function api(): ReturnType<typeof request> {
  return request(`http://localhost:${process.env.PORT}`);
}

// Vacía la base de pruebas entre archivos. usuarios se conserva solo con el administrador inicial,
// que la API crea al arrancar; el resto de tablas se trunca y reinicia sus secuencias.
export async function limpiarBase(): Promise<void> {
  const conexion = await new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  }).initialize();
  try {
    const tablas: { tablename: string }[] = await conexion.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('migrations', 'usuarios')",
    );
    if (tablas.length > 0) {
      const lista = tablas.map(({ tablename }) => `"${tablename}"`).join(', ');
      await conexion.query(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
    }
    await conexion.query("DELETE FROM usuarios WHERE rol <> 'administrador'");
  } finally {
    await conexion.destroy();
  }
}

export interface Sesion {
  id: number;
  email: string;
  token: string;
  refreshToken: string;
}

let contador = 0;

export function autorizacion(sesion: Sesion): [string, string] {
  return ['Authorization', `Bearer ${sesion.token}`];
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<Sesion> {
  const respuesta = await api()
    .post(`${API}/autenticacion/iniciar_sesion`)
    .send({ email, password })
    .expect(200);
  const perfil = await api()
    .get(`${API}/usuarios/perfil`)
    .set('Authorization', `Bearer ${respuesta.body.accessToken}`)
    .expect(200);
  return {
    id: perfil.body.id,
    email,
    token: respuesta.body.accessToken,
    refreshToken: respuesta.body.refreshToken,
  };
}

export async function sesionAdmin(): Promise<Sesion> {
  return iniciarSesion(
    process.env.ADMIN_EMAIL ?? '',
    process.env.ADMIN_PASSWORD ?? '',
  );
}

export async function registrar(
  rol: 'ciudadano' | 'fundacion',
  nombre?: string,
): Promise<Sesion> {
  const email = `${rol}${Date.now()}${++contador}@e2e.test`;
  await api()
    .post(`${API}/autenticacion/registro`)
    .send({
      nombre:
        nombre ?? (rol === 'fundacion' ? 'Fundación Patitas' : 'Ana Pérez'),
      email,
      password: CLAVE,
      rol,
    })
    .expect(201);
  return iniciarSesion(email, CLAVE);
}

export async function verificarFundacion(
  admin: Sesion,
  fundacion: Sesion,
): Promise<void> {
  await api()
    .patch(`${API}/fundaciones/${fundacion.id}/verificacion`)
    .set(...autorizacion(admin))
    .send({ verificada: true })
    .expect(200);
}

export async function crearMascota(
  fundacion: Sesion,
  cambios: Partial<typeof MASCOTA> = {},
): Promise<number> {
  const respuesta = await api()
    .post(`${API}/mascotas`)
    .set(...autorizacion(fundacion))
    .send({ ...MASCOTA, ...cambios })
    .expect(201);
  return respuesta.body.id;
}
