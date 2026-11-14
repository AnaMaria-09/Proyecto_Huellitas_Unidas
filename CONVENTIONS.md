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
