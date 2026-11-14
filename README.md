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
