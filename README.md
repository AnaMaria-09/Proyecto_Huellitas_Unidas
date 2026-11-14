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

Roles disponibles: `ciudadano`, `fundacion` y `administrador`.

> Estado actual: `adopciones` y `archivos` tienen por ahora solo sus reglas de
> dominio y piezas base; sus endpoints llegarán cuando la base de datos esté
> integrada.

## Requisitos

- Node.js 22 o superior y npm.
- Docker y Docker Compose (para levantar la API junto con PostgreSQL).

## Cómo levantar el proyecto

### Con Docker (recomendado)

```bash
cp .env.example .env      # completa los valores
docker compose up --build
```

La API queda en `http://localhost:3000` y PostgreSQL en el puerto definido en `.env`.

### Sin Docker

Necesitas una instancia de PostgreSQL accesible con los datos de `.env`.

```bash
npm install
cp .env.example .env      # completa los valores
npm run migration:run     # crea las tablas
npm run start:dev         # modo desarrollo con recarga
```

> La configuración de base de datos, `docker-compose.yml`, `.env.example` y las
> migraciones se están integrando; hasta entonces la API arranca con
> almacenamiento en memoria usando solo `npm install` y `npm run start:dev`.

## Variables de entorno

| Variable                      | Obligatoria | Descripción                                                        | Ejemplo                  |
| ----------------------------- | ----------- | ------------------------------------------------------------------ | ------------------------ |
| `PORT`                        | No          | Puerto HTTP de la API (por defecto `3000`).                        | `3000`                   |
| `JWT_SECRET`                  | Sí          | Secreto para firmar los JWT. Mínimo 32 caracteres.                 | `cambia-este-secreto...` |
| `DB_HOST`                     | Sí          | Host de PostgreSQL.                                                | `localhost`              |
| `DB_PORT`                     | Sí          | Puerto de PostgreSQL.                                              | `5432`                   |
| `DB_USERNAME`                 | Sí          | Usuario de PostgreSQL.                                             | `huellitas`              |
| `DB_PASSWORD`                 | Sí          | Contraseña de PostgreSQL.                                          | `********`               |
| `DB_NAME`                     | Sí          | Nombre de la base de datos.                                        | `huellitas_unidas`       |
| `ALMACENAMIENTO_DIR`          | No          | Directorio donde se guardan los archivos subidos.                  | `uploads`                |
| `URL_FIRMADA_SECRETO`         | Sí          | Secreto HMAC para firmar URLs de archivos. Mínimo 32 caracteres.   | `otro-secreto-largo...`  |
| `URL_FIRMADA_EXPIRA_SEGUNDOS` | No          | Vigencia de una URL firmada en segundos.                           | `300`                    |

Nunca subas el archivo `.env` al repositorio: está en `.gitignore`. Los nombres
exactos de las variables de base de datos se confirmarán cuando la configuración
esté en `main`.

## Scripts de npm

| Script                  | Qué hace                                                   |
| ----------------------- | ---------------------------------------------------------- |
| `npm run start`         | Arranca la API.                                            |
| `npm run start:dev`     | Arranca en modo desarrollo con recarga automática.         |
| `npm run start:debug`   | Arranca con el inspector de Node activo.                   |
| `npm run start:prod`    | Ejecuta la versión compilada (`dist/main`).                |
| `npm run build`         | Compila el proyecto a `dist/`.                             |
| `npm run lint`          | Revisa el código con oxlint.                               |
| `npm run format`        | Formatea el código con Prettier.                           |
| `npm run test`          | Ejecuta las pruebas unitarias.                             |
| `npm run test:watch`    | Ejecuta las pruebas en modo observación.                   |
| `npm run test:cov`      | Ejecuta las pruebas con reporte de cobertura.              |
| `npm run test:e2e`      | Ejecuta las pruebas end-to-end.                            |
| `npm run migration:run` | Aplica las migraciones de TypeORM (cuando estén en `main`). |

## Pruebas

```bash
npm run test        # pruebas unitarias (*.spec.ts)
npm run test:cov    # con cobertura en ./coverage
npm run test:e2e    # pruebas end-to-end (requieren base de datos)
```

Usa siempre los scripts de npm y no `npx jest`: el script activa el modo ESM de
Node (`--experimental-vm-modules`), que Nest 12 necesita.
