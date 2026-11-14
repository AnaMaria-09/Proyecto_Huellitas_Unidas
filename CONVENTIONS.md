# Convenciones del proyecto

Reglas que seguimos en Huellitas Unidas para que el código se lea igual sin
importar quién lo escribió.

## Idioma

- Todo lo del dominio va en **español**: módulos, rutas, clases, métodos,
  campos, tablas, columnas, DTOs y mensajes de error.
  - Bien: `MascotasService.cambiarEstado()`, ruta `/fundaciones/mi_fundacion`,
    campo `fechaEntrega`.
  - Mal: `PetsService.updateStatus()`, ruta `/foundations/me`.
- Se permiten en inglés los nombres que impone el framework o las librerías
  (`Controller`, `Module`, `canActivate`, sufijos `.dto.ts`, `.spec.ts`).
- Las rutas usan minúsculas; las palabras compuestas se separan con `_`
  (`iniciar_sesion`, `mi_fundacion`).

## Estructura de cada módulo

```
src/<modulo>/
├── <modulo>.controller.ts        # solo HTTP: rutas, guards, pipes
├── <modulo>.controller.spec.ts
├── <modulo>.service.ts           # reglas de negocio
├── <modulo>.service.spec.ts
├── <modulo>.module.ts            # registro de providers
├── dto/                          # DTOs de entrada con class-validator
│   └── crear-<entidad>.dto.ts
└── entities/                     # entidades de TypeORM
    └── <entidad>.entity.ts
```

- El controller no tiene lógica de negocio: delega en el servicio.
- Las pruebas (`*.spec.ts`) viven junto al archivo que prueban.
- Reglas puras del dominio (tablas de transiciones, cálculos) pueden ir en una
  carpeta `dominio/` para probarlas sin Nest ni base de datos.

## Ramas

Se crean siempre desde `main` actualizado (`git checkout main && git pull origin main`).

| Prefijo  | Uso                                   | Ejemplo                         |
| -------- | ------------------------------------- | ------------------------------- |
| `feat/`  | Funcionalidad nueva                   | `feat/adopciones-dominio`       |
| `fix/`   | Corrección de un error                | `fix/mascotas-filtro-ciudad`    |
| `docs/`  | Solo documentación                    | `docs/readme-convenciones-ci`   |
| `ci/`    | Integración continua y automatización | `ci/cache-npm`                  |
| `test/`  | Solo pruebas                          | `test/usuarios-servicio`        |

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/) con la
descripción en español, en modo imperativo y en minúscula:

```
<tipo>(<modulo>): <descripción corta>
```

| Tipo       | Cuándo                                        |
| ---------- | --------------------------------------------- |
| `feat`     | Funcionalidad nueva.                          |
| `fix`      | Corrección de un error.                       |
| `test`     | Agregar o corregir pruebas.                   |
| `docs`     | Documentación.                                |
| `ci`       | Flujos de integración continua.               |
| `refactor` | Cambio interno sin alterar el comportamiento. |
| `chore`    | Mantenimiento (dependencias, configuración).  |

Ejemplos:

```
feat(mascotas): agregar búsqueda por ciudad
fix(autenticacion): rechazar tokens expirados
test(adopciones): cubrir la matriz completa de transiciones
```

Commits pequeños y con sentido: cada uno debe compilar y explicar un solo cambio.

## Pull requests

- Se abren hacia `main` y usan la plantilla de `.github/pull_request_template.md`.
- Antes de abrirlo: `git pull --rebase origin main`.
- `npm run build`, `npm run lint` y `npm run test` deben pasar (la CI lo verifica).
- Lo revisa y aprueba **la otra persona del equipo** antes de mergear.
- Sin marcas de agua: nada de `Co-Authored-By` automáticos, firmas de
  herramientas ni menciones a asistentes en commits, PRs, código o comentarios.
- Un PR resuelve una sola cosa; si crece demasiado, se divide.
