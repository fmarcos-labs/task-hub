# FASE 1: TasksModule + DTO unificado

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_0

Crear el módulo `Tasks` con su controller, service esqueleto y el DTO unificado que ambas fuentes (Reminders y Todoist) deberán satisfacer.

## Orden de ejecución

1. Tarea 1.A — DTO `UnifiedTask` + enums (otros archivos lo importan).
2. Tarea 1.B — Interfaz `TaskSource` (contrato que cumplirán Reminders y Todoist).
3. Tarea 1.C — `TasksService` esqueleto (sin fuentes aún, retorna `[]`).
4. Tarea 1.D — `TasksController` con endpoints `/tasks` y `/tasks/refresh`.
5. Tarea 1.E — `TasksModule` + registrar en `AppModule`.
6. Tarea 1.F — Tests unitarios del service.

## Tareas

### Tarea 1.A: DTOs y tipos del dominio

- Archivo: `src/modules/tasks/dto/unified-task.dto.ts` (crear)
- Qué hacer: clase `UnifiedTaskDto` con campos `id`, `title`, `dueDate?`, `source`, `priority`, `list?`, `completed`. Decorar con `@ApiProperty` para Swagger. Sin `class-validator` (es DTO de salida, no entrada).
- Archivo: `src/modules/tasks/dto/task-source.enum.ts` (crear)
- Qué hacer: `enum TaskSource { REMINDERS = 'reminders', TODOIST = 'todoist' }`.
- Archivo: `src/modules/tasks/dto/task-priority.enum.ts` (crear)
- Qué hacer: `enum TaskPriority { NONE = 'none', LOW = 'low', MEDIUM = 'medium', HIGH = 'high' }`.
- Archivo: `src/modules/tasks/dto/index.ts` (crear) — barrel.
- Referencia: `src/modules/example/dto/` para el patrón de barrel + decorators Swagger.

### Tarea 1.B: Contrato de fuente de tareas

- Archivo: `src/modules/tasks/sources/task-source.interface.ts` (crear)
- Qué hacer:
  ```ts
  export interface TaskSource {
    readonly name: TaskSourceName;
    fetch(): Promise<UnifiedTaskDto[]>;
  }
  ```
  Donde `TaskSourceName` reusa el enum `TaskSource` (renombrar si hay colisión).
- Razón: cada fuente (Reminders, Todoist) implementa esta interfaz; el service las consume sin acoplarse.

### Tarea 1.C: TasksService esqueleto

- Archivo: `src/modules/tasks/tasks.service.ts` (crear)
- Qué hacer:
  - Inyectar `Logger` (nestjs-pino).
  - Métodos `getTasks(): Promise<UnifiedTaskDto[]>` y `refresh(): Promise<{ count: number; refreshedAt: string }>`.
  - Por ahora ambos retornan estructura vacía — las fuentes se conectan en FASE 2-3.
  - El método `refresh()` retorna `crypto.randomUUID()` ❌ — usar `new Date().toISOString()` como timestamp; el ID lo genera el caché en FASE 4.

### Tarea 1.D: TasksController

- Archivo: `src/modules/tasks/tasks.controller.ts` (crear)
- Qué hacer:
  - `@Controller('tasks')` (el prefix `/api/v1` ya viene del bootstrap).
  - `GET /` → `service.getTasks()`. Anotar con `@ApiOperation`, `@ApiOkResponse({ type: [UnifiedTaskDto] })`.
  - `GET /refresh` → `service.refresh()`. (Concepto: `GET /tasks/refresh`. Mantener GET para coincidir, aunque idiomáticamente sería POST — anotarlo como decisión en `docs/decisions/`).

### Tarea 1.E: Módulo + registro

- Archivo: `src/modules/tasks/tasks.module.ts` (crear) — declara controller + service, exporta service.
- Archivo: `src/modules/tasks/index.ts` (crear) — barrel exporta `TasksModule` y DTOs públicos.
- Archivo: `src/app.module.ts` (modificar) — agregar `TasksModule` al array de `imports`.

### Tarea 1.F: Tests del service

- Archivo: `src/modules/tasks/tasks.service.spec.ts` (crear)
- Qué hacer: cubrir `getTasks()` retorna array (vacío por ahora) y `refresh()` retorna `{ count, refreshedAt }` con `refreshedAt` parseable como ISO date.
- Referencia: `src/modules/example/example.service.spec.ts` para el patrón con `Test.createTestingModule`.

## Criterios de Aceptación

- [ ] `GET /api/v1/tasks` responde HTTP 200 con `[]`.
- [ ] `GET /api/v1/tasks/refresh` responde HTTP 200 con `{ count: 0, refreshedAt: <ISO> }`.
- [ ] Swagger en `/docs` muestra ambos endpoints con el schema `UnifiedTask`.
- [ ] `pnpm test` pasa con el spec del service.
- [ ] `pnpm build` pasa sin errores de tipos.
