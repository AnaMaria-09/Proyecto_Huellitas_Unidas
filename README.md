# Huellitas Unidas

API REST para la adopción responsable de animales. Conecta a **fundaciones** que
publican mascotas en adopción con **ciudadanos** que quieren adoptarlas, y da a los
**administradores** herramientas para verificar fundaciones y gestionar usuarios.

Los nombres de módulos, rutas, campos y tablas están en español.

## Stack

| Capa              | Tecnología                                   |
| ----------------- | -------------------------------------------- |
| Framework         | NestJS 12                                    |
| Lenguaje          | TypeScript (modo estricto)                   |
| Base de datos     | PostgreSQL 16                                |
| ORM               | TypeORM                                      |
| Autenticación     | JWT (`@nestjs/jwt`) + bcrypt                 |
| Validación        | class-validator + class-transformer          |
| Contenedores      | Docker y Docker Compose                      |
| Pruebas           | Jest (modo ESM) + Supertest                  |
| Lint              | oxlint                                       |

## Arquitectura por módulos

Cada dominio vive en su propio módulo dentro de `src/`:

| Módulo          | Responsabilidad                                                                   |
| --------------- | --------------------------------------------------------------------------------- |
| `autenticacion` | Registro, inicio de sesión, emisión de JWT y guards de autenticación y roles.     |
| `usuarios`      | Perfil del usuario autenticado y administración de usuarios.                      |
| `fundaciones`   | Datos de las fundaciones y su verificación por parte de un administrador.         |
| `mascotas`      | Publicación, búsqueda con filtros y ciclo de vida (estados) de las mascotas.      |
| `adopciones`    | Solicitudes de adopción: creación, evaluación, entrega y cancelación.             |
| `archivos`      | Subida, validación y entrega mediante URLs firmadas de fotos y documentos.        |

Roles disponibles: `ciudadano`, `fundacion` y `administrador`. El registro
público solo crea ciudadanos y fundaciones; el administrador inicial se crea al
arrancar con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Una fundación solo puede publicar
mascotas cuando un administrador la verifica.

## Requisitos

- Node.js 22 o superior y npm.
- Docker y Docker Compose (para PostgreSQL, o para levantar todo junto).

## Cómo levantar el proyecto

### Con Docker (API + PostgreSQL)

```bash
git clone https://github.com/AnaMaria-09/Proyecto_Huellitas_Unidas.git
cd Proyecto_Huellitas_Unidas
cp .env-example .env      # cambia las contraseñas y los secretos
docker compose up -d --build postgres api
```

Al arrancar, el contenedor aplica las migraciones pendientes y corre la API en
modo producción (sin `synchronize`), aunque `.env` diga `development`. La API
queda en `http://localhost:3000/api/v1` y Swagger en
`http://localhost:3000/api/docs`. Los archivos subidos se guardan en el volumen
`archivos_datos`.

El servicio `api` tiene un healthcheck que consulta `GET /api/v1/salud` con el
`fetch` de Node (la imagen no trae curl). `docker compose ps` muestra `healthy`
cuando la API y la base de datos responden.

### En local (PostgreSQL en Docker)

```bash
npm install
cp .env-example .env               # cambia las contraseñas y los secretos
docker compose up -d postgres
npm run migration:run              # crea las tablas
npm run start:dev                  # modo desarrollo con recarga
```

Si el puerto 5432 ya lo usa otro PostgreSQL, cambia `POSTGRES_PORT` en `.env`
(por ejemplo a `5436`): `docker-compose.yml` publica la base en ese puerto.

Para generar secretos largos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Con `NODE_ENV=development` TypeORM sincroniza el esquema al arrancar. Si
> cambias una entidad, genera la migración **antes** de levantar la API
> (`npm run migration:generate -- src/database/migrations/<Nombre>`); si no,
> la tabla ya existirá y la migración saldrá vacía.

Prueba rápida:

```bash
curl -X POST http://localhost:3000/api/v1/autenticacion/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","email":"ana@example.com","password":"clave-segura-123","rol":"ciudadano"}'
```

## Variables de entorno

Están todas en [`.env-example`](.env-example). Al arrancar se validan con Joi: si
falta una obligatoria o tiene un formato inválido, la API no arranca y dice cuál.

| Variable                                 | Obligatoria | Descripción                                                 | Por defecto |
| ---------------------------------------- | ----------- | ----------------------------------------------------------- | ----------- |
| `PORT`                                   | Sí          | Puerto HTTP de la API.                                      |             |
| `NODE_ENV`                               | Sí          | `development`, `production` o `test`.                       |             |
| `POSTGRES_HOST`                          | Sí          | Host de PostgreSQL.                                         |             |
| `POSTGRES_PORT`                          | Sí          | Puerto de PostgreSQL.                                       |             |
| `POSTGRES_DB`                            | Sí          | Nombre de la base de datos.                                 |             |
| `POSTGRES_USER`                          | Sí          | Usuario de PostgreSQL.                                      |             |
| `POSTGRES_PASSWORD`                      | Sí          | Contraseña de PostgreSQL.                                   |             |
| `JWT_SECRET`                             | Sí          | Secreto para firmar los JWT. Mínimo 32 caracteres.          |             |
| `JWT_EXPIRES_IN`                         | No          | Duración del access token (`15m`, `12h`, `7d`…).            | `15m`       |
| `JWT_REFRESH_EXPIRES_IN`                 | No          | Duración del refresh token.                                 | `7d`        |
| `CORS_ORIGINS`                           | Sí          | Orígenes permitidos, separados por comas.                   |             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`         | No          | Administrador inicial. Se definen las dos o ninguna.        |             |
| `ALMACENAMIENTO_DIR`                     | No          | Directorio de los archivos subidos.                         | `uploads`   |
| `URL_FIRMADA_SECRETO`                    | Sí          | Secreto HMAC de las URLs de descarga. Mínimo 32 caracteres. |             |
| `URL_FIRMADA_EXPIRA_SEGUNDOS`            | No          | Vigencia de una URL firmada.                                | `300`       |
| `LIMITE_PETICIONES_POR_MINUTO`           | No          | Peticiones por minuto e IP en toda la API.                  | `100`       |
| `LIMITE_AUTENTICACION_POR_MINUTO`        | No          | Intentos por minuto e IP de registro e inicio de sesión.    | `5`         |
| `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` | No          | Credenciales de NestJS Observe. Sin ellas no se activa.     |             |

Nunca subas `.env` ni `.env.test` al repositorio: están en `.gitignore`.

## Scripts de npm

| Script                       | Qué hace                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `npm run start:dev`          | Arranca en modo desarrollo con recarga automática.           |
| `npm run start:debug`        | Arranca con el inspector de Node activo.                     |
| `npm run build`              | Compila el proyecto a `dist/`.                               |
| `npm run start:prod`         | Ejecuta la versión compilada (`dist/main`).                  |
| `npm run lint`               | Revisa el código con oxlint.                                 |
| `npm run format`             | Formatea el código con Prettier.                             |
| `npm run test`               | Pruebas unitarias.                                           |
| `npm run test:cov`           | Pruebas unitarias con cobertura en `./coverage`.             |
| `npm run test:e2e`           | Pruebas end-to-end contra una base de pruebas.               |
| `npm run migration:generate` | Genera una migración comparando las entidades con la base.   |
| `npm run migration:run`      | Aplica las migraciones pendientes.                           |
| `npm run migration:revert`   | Revierte la última migración.                                |
| `npm run migration:run:prod` | Aplica las migraciones con el build (el contenedor lo hace al arrancar). |

## Pruebas

Usa siempre los scripts de npm y no `npx jest`: activan el modo ESM de Node
(`--experimental-vm-modules`), que Nest 12 necesita.

```bash
npm run test        # pruebas unitarias (*.spec.ts), sin base de datos
npm run test:cov    # con cobertura
```

### Pruebas end-to-end

Usan su propia base de datos (`huellitas_unidas_test`), que vacían entre
archivos, y su propio archivo de entorno:

```bash
cp .env.test.example .env.test     # cambia las contraseñas y los secretos
docker compose up -d postgres
docker compose exec postgres createdb -U huellitas huellitas_unidas_test   # solo la primera vez
npm run test:e2e
```

`npm run test:e2e` compila la API, aplica las migraciones en la base de pruebas,
la arranca con `NODE_ENV=test` en el `PORT` de `.env.test` (3100 en el ejemplo)
y la detiene al terminar. Las pruebas le hablan por HTTP con Supertest. En
`.env.test` los límites de peticiones se suben para poder registrar muchos
usuarios seguidos. En la CI las mismas variables vienen del workflow y
PostgreSQL 16 corre como servicio.

## Documentación de la API (Swagger)

Con la API corriendo: `http://localhost:3000/api/docs`. Para probar rutas
protegidas, inicia sesión, copia el `accessToken` y pégalo en **Authorize**.

## Demostración con Postman

En [`docs/postman/`](docs/postman) está la colección
`huellitas-unidas.postman_collection.json`, con 50 peticiones en 7 carpetas que
recorren toda la API en orden:

0. Salud
1. Autenticación: registro, inicio de sesión y refresh token, incluida la reutilización (401).
2. Usuarios y fundaciones: perfil y verificación por el administrador.
3. Mascotas: GET, POST, PUT y búsqueda con filtros.
4. Archivos: subida de foto y descarga con URL firmada.
5. Adopciones: solicitud, rechazo automático de la otra solicitud, aprobación, entrega, historial y cancelación.
6. Errores y validaciones: 400, 401, 403, 404 y 409.

Cada petición comprueba el código de respuesta y guarda los ids y tokens que
usan las siguientes, así que no hay que copiar nada a mano.

1. Levanta la API (`docker compose up -d --build postgres api` o `npm run start:dev`).
2. En Postman, **Import** → los dos archivos de `docs/postman/` (colección y entorno).
3. Elige el entorno **Huellitas Unidas (local)** y escribe en `adminEmail` y
   `adminPassword` los valores de `ADMIN_EMAIL` y `ADMIN_PASSWORD` de tu `.env`.
4. Ejecuta las carpetas en orden, o la colección completa con **Run collection**.

Notas:

- Cada ejecución crea usuarios nuevos (el email lleva un sufijo con la hora).
  Registro e inicio de sesión aceptan 5 intentos por minuto e IP: entre dos
  ejecuciones completas espera un minuto.
- En **Subir foto de la mascota**, si el archivo aparece en rojo, selecciona
  `docs/postman/luna.png` (o cualquier PNG, JPEG o WebP) en el campo `imagenes`.

## Resumen de endpoints

Todas las rutas usan el prefijo `/api/v1`. 🔒 = requiere `Authorization: Bearer <accessToken>`.

### autenticacion

| Método | Ruta                                | Acceso           | Descripción                                             |
| ------ | ----------------------------------- | ---------------- | ------------------------------------------------------- |
| POST   | `/autenticacion/registro`           | Público          | Registra un ciudadano o una fundación.                  |
| POST   | `/autenticacion/iniciar_sesion`     | Público          | Devuelve `accessToken` y `refreshToken`.                |
| POST   | `/autenticacion/refrescar_token`    | Público          | Cambia un refresh token por un par nuevo (un solo uso). |
| POST   | `/autenticacion/cerrar_sesion`      | 🔒 Cualquier rol | Revoca el refresh token de la sesión.                   |
| PATCH  | `/autenticacion/cambiar_contrasena` | 🔒 Cualquier rol | Cambia la contraseña y cierra todas las sesiones.       |
| PATCH  | `/autenticacion/usuarios/:id/rol`   | 🔒 administrador | Cambia el rol de un usuario.                            |

### usuarios

| Método | Ruta                   | Acceso                      | Descripción                     |
| ------ | ---------------------- | --------------------------- | ------------------------------- |
| GET    | `/usuarios/perfil`     | 🔒 Cualquier rol            | Perfil del usuario autenticado. |
| PATCH  | `/usuarios/perfil`     | 🔒 Cualquier rol            | Actualiza el propio perfil.     |
| GET    | `/usuarios`            | 🔒 administrador            | Lista los usuarios, paginado.   |
| GET    | `/usuarios/:id`        | 🔒 administrador o el mismo | Detalle de un usuario.          |
| PATCH  | `/usuarios/:id/estado` | 🔒 administrador            | Activa o inactiva un usuario.   |

### fundaciones

| Método | Ruta                            | Acceso                     | Descripción                          |
| ------ | ------------------------------- | -------------------------- | ------------------------------------ |
| GET    | `/fundaciones`                  | Público                    | Lista las fundaciones verificadas.   |
| GET    | `/fundaciones/:id`              | Público si está verificada | Detalle de una fundación.            |
| PATCH  | `/fundaciones/mi_fundacion`     | 🔒 fundacion               | Actualiza los datos de la fundación. |
| PATCH  | `/fundaciones/:id/verificacion` | 🔒 administrador           | Verifica o retira la verificación.   |

### mascotas

| Método | Ruta                     | Acceso       | Descripción                                      |
| ------ | ------------------------ | ------------ | ------------------------------------------------ |
| GET    | `/mascotas`              | Público      | Lista las mascotas disponibles, paginado.        |
| GET    | `/mascotas/buscar`       | Público      | Búsqueda con filtros (especie, tamaño, ciudad…). |
| GET    | `/mascotas/mis_mascotas` | 🔒 fundacion | Mascotas propias en cualquier estado.            |
| GET    | `/mascotas/:id`          | Público      | Detalle de una mascota.                          |
| POST   | `/mascotas`              | 🔒 fundacion | Publica una mascota (fundación verificada).      |
| PUT    | `/mascotas/:id`          | 🔒 fundacion | Actualiza una mascota propia.                    |
| PATCH  | `/mascotas/:id/estado`   | 🔒 fundacion | Cambia el estado según las transiciones válidas. |
| DELETE | `/mascotas/:id`          | 🔒 fundacion | Elimina una mascota propia que esté disponible.  |

### adopciones

Estados de una solicitud: `pendiente` → `aprobada` → `completada`, o
`rechazada` / `cancelada`. Cada cambio queda en el historial y, cuando
corresponde, cambia el estado de la mascota en la misma transacción.

| Método | Ruta                                | Acceso                                | Descripción                                                                                  |
| ------ | ----------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| POST   | `/adopciones`                       | 🔒 ciudadano                          | Crea una solicitud. 409 si la mascota no está disponible o ya hay una activa del ciudadano. |
| GET    | `/adopciones/mis_solicitudes`       | 🔒 ciudadano                          | Solicitudes propias (`?estado=&pagina=&limite=`).                                            |
| GET    | `/adopciones/recibidas`             | 🔒 fundacion                          | Solicitudes de sus mascotas; del adoptante solo id, nombre y email.                         |
| GET    | `/adopciones/:id`                   | 🔒 adoptante, fundación dueña o admin | Detalle. 404 para cualquier otro usuario.                                                    |
| GET    | `/adopciones/:id/historial`         | 🔒 adoptante, fundación dueña o admin | Cambios de estado ordenados por fecha.                                                       |
| PATCH  | `/adopciones/:id/evaluacion`        | 🔒 fundación dueña                    | Aprueba (mascota → en proceso, rechaza las demás pendientes) o rechaza con motivo.          |
| PATCH  | `/adopciones/:id/confirmar_entrega` | 🔒 fundación dueña                    | Solo desde `aprobada`: solicitud → completada, mascota → adoptada.                          |
| DELETE | `/adopciones/:id`                   | 🔒 ciudadano adoptante                | Cancela (no borra). Si estaba aprobada, la mascota vuelve a disponible.                     |

### archivos

Imágenes PNG, JPEG o WebP de hasta 5 MB (máximo 5 por petición) y documentos PDF
de hasta 10 MB. El tipo se comprueba por el contenido, no por la extensión. Las
descargas usan URLs firmadas que vencen en `URL_FIRMADA_EXPIRA_SEGUNDOS`.

| Método | Ruta                           | Acceso                                | Descripción                                                                       |
| ------ | ------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------- |
| POST   | `/archivos/imagenes`           | 🔒 fundación dueña de la mascota      | Sube fotos de una mascota (`multipart/form-data`: `mascotaId`, `imagenes`).       |
| POST   | `/archivos/documentos`         | 🔒 Cualquier rol                      | Sube un PDF (`documento`).                                                        |
| GET    | `/archivos/mascota/:mascotaId` | Público si la mascota está disponible | Imágenes de una mascota con su URL firmada.                                       |
| GET    | `/archivos/:id/url_firmada`    | 🔒 Dueño o administrador              | Genera una URL de descarga nueva.                                                 |
| GET    | `/archivos/descargar/:id`      | Con firma válida                      | Descarga el archivo (`?expira=…&firma=…`). 403 si la firma no es válida o venció. |
| DELETE | `/archivos/:id`                | 🔒 Dueño o administrador              | Elimina el archivo.                                                               |

Al eliminar una mascota, `MascotasService` emite el evento `mascota.eliminada` y
el módulo de archivos borra sus imágenes del disco y de la base. Si un archivo
físico no se puede borrar, queda registrado en el log y la limpieza continúa.

### salud

| Método | Ruta      | Acceso  | Descripción                                                                                       |
| ------ | --------- | ------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/salud`  | Público | Estado de la API y de la conexión a PostgreSQL. 200 si todo responde, 503 si no. Sin límite de peticiones. |

Ejemplo de respuesta:

```json
{ "status": "ok", "info": { "baseDeDatos": { "status": "up" } }, "error": {}, "details": { "baseDeDatos": { "status": "up" } } }
```

## Tareas programadas

- **Limpieza de tokens de refresco:** todos los días a las 3:00 se borran de
  `tokens_refresco` los tokens vencidos o revocados hace más de 7 días. Mientras
  tanto se conservan para detectar si alguien reutiliza un token revocado.
- Las tareas no corren con `NODE_ENV=test`, así que no interfieren con las pruebas e2e.

## Convenciones

Revisa [CONVENTIONS.md](CONVENTIONS.md) antes de abrir un PR.

## Despliegue

Antes de desplegar en producción revisa la
[documentación de despliegue de NestJS](https://docs.nestjs.com/deployment).
El proyecto incluye `@nestjs/mau`, la plataforma oficial de Nest para desplegar
en AWS:

```bash
npm install -g @nestjs/mau
mau deploy
```

## Observabilidad

La API ya incluye [NestJS Observe](https://observe.nestjs.com) (`@nestjs/observe`)
en `app.module.ts`: trazas distribuidas, logs correlacionados, métricas de
peticiones, seguimiento de errores y alertas. Para activarlo se necesitan las
credenciales de la aplicación (`OBSERVE_APP_KEY` y `OBSERVE_APP_SECRET`), que
deben llegar por variables de entorno y nunca escribirse en el código.

## Recursos

- [Documentación de NestJS](https://docs.nestjs.com)
- [Canal de Discord de NestJS](https://discord.gg/G7Qnnhy)
- [Cursos oficiales de NestJS](https://courses.nestjs.com/)
- [NestJS Devtools](https://devtools.nestjs.com) para visualizar el grafo de la aplicación
- [Documentación de TypeORM](https://typeorm.io)
- [Documentación de class-validator](https://github.com/typestack/class-validator)

## Licencia

Proyecto académico privado (`UNLICENSED`). NestJS se distribuye bajo
[licencia MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
