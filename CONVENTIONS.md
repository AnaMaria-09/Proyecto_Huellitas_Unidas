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

## Cómo aplicamos SOLID

### S — Responsabilidad única

Cada clase hace una sola cosa. En `archivos`, guardar bytes
(`AlmacenamientoLocal`), validar el contenido (`ValidadorArchivos`) y firmar URLs
(`UrlFirmadaService`) son tres clases distintas; ninguna conoce a las otras.

### O — Abierto/cerrado

Las reglas se escriben como **mapas o tablas**, no como cadenas de `if`. Para
agregar un caso se edita la tabla, no la lógica que la usa.

```ts
// src/mascotas/mascotas.service.ts
const TRANSICIONES_PERMITIDAS: Record<EstadoMascota, EstadoMascota[]> = {
  disponible: ['en_proceso'],
  en_proceso: ['disponible', 'adoptada'],
  adoptada: [],
};

if (!TRANSICIONES_PERMITIDAS[mascota.estado].includes(nuevoEstado)) {
  throw new ConflictException(/* ... */);
}
```

Lo mismo aplica a las transiciones de solicitudes de adopción y a las reglas de
tipos de archivo permitidos (tipo MIME → tamaño máximo y firma de bytes).

### L — Sustitución de Liskov

Cualquier implementación de una interfaz debe poder reemplazar a otra sin que
quien la usa lo note. `AlmacenamientoLocal` implementa `ProveedorAlmacenamiento`;
un futuro almacenamiento en la nube debe respetar el mismo contrato (mismos
tipos de retorno y mismas excepciones), de modo que el resto del código no cambie.

### I — Segregación de interfaces

Interfaces pequeñas y específicas. `ProveedorAlmacenamiento` solo expone
`guardar`, `obtener`, `eliminar` y `existe`; no mezcla validación ni firmas.
Los guards también están separados: `AutenticadoGuard` verifica el JWT y
`RolesGuard` solo revisa el rol a partir del decorador `@Roles()`.

```ts
@UseGuards(AutenticadoGuard, RolesGuard)
@Roles('fundacion')
crear(/* ... */) {}
```

### D — Inversión de dependencias

- Inyección siempre por constructor.
- Se depende de abstracciones mediante **tokens de inyección**:

```ts
@Module({
  providers: [{ provide: PROVEEDOR_ALMACENAMIENTO, useClass: AlmacenamientoLocal }],
})

constructor(
  @Inject(PROVEEDOR_ALMACENAMIENTO) private readonly almacenamiento: ProveedorAlmacenamiento,
) {}
```

- Los servicios **no leen `process.env`**: la configuración les llega inyectada
  (por ejemplo `OPCIONES_URL_FIRMADA`, construida a partir de `ConfigService`).

## Buenas prácticas de TypeScript

- Prohibido `any`; usa tipos concretos o `unknown`.
- Toda promesa se espera con `await` (o se retorna).
- Errores con las excepciones de NestJS (`BadRequestException`,
  `ConflictException`, …) y mensajes en español.
- Los tipos usados en firmas de métodos decorados se importan con `import type`
  (si no, la compilación falla con TS1272 por `isolatedModules`).

## Seguridad

- **Sin secretos en el código**: ni claves, ni contraseñas, ni tokens. Todo va
  en variables de entorno y `.env` nunca se sube.
- **Nunca se devuelve `passwordHash`** en una respuesta: usa `sinPasswordHash()`
  o un tipo `UsuarioPublico`.
- **DTOs en toda entrada** (`@Body()`, `@Query()`, `@Param()` complejos) con
  class-validator; el `ValidationPipe` global usa `whitelist: true` para
  descartar campos no declarados.
- Las contraseñas se guardan con bcrypt; los secretos de JWT y de URLs firmadas
  tienen al menos 32 caracteres.
- Los archivos subidos se validan por su contenido real (magic numbers), se
  guardan con nombres aleatorios y nunca con el nombre original.
