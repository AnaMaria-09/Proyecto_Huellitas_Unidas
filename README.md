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
