# FASE 3: Todoist source (REST API v2)

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_1

Implementar la fuente de Todoist consumiendo `https://api.todoist.com/rest/v2/tasks` y `…/projects` con bearer token.

## Orden de ejecución

1. Tarea 3.A — Cliente HTTP de Todoist.
2. Tarea 3.B — Mapper `Todoist → UnifiedTaskDto`.
3. Tarea 3.C — `TodoistSource` que implementa `TaskSource`.
4. Tarea 3.D — Cablear en `TasksModule` + integrar con service.
5. Tarea 3.E — Tests con mock de fetch.

## Tareas

### Tarea 3.A: Cliente HTTP

- Archivo: `src/modules/tasks/sources/todoist/todoist.client.ts` (crear)
- Qué hacer:
  - `@Injectable()` con `ConfigService`.
  - `getTasks(): Promise<TodoistTask[]>` y `getProjects(): Promise<TodoistProject[]>` usando `fetch` nativo de Node 22.
  - Header `Authorization: Bearer ${TODOIST_API_TOKEN}` leído vía `ENV_KEYS.TODOIST_API_TOKEN`.
  - Timeout 10s con `AbortController`.
  - Si HTTP no-OK → lanzar `TodoistApiError` (custom). El mapeo a HTTP del lado consumidor es responsabilidad del caller.
- Tipos `TodoistTask`/`TodoistProject` declarados explícitamente (no `any`) en `todoist.types.ts`.

### Tarea 3.B: Mapper

- Archivo: `src/modules/tasks/sources/todoist/todoist.mapper.ts` (crear)
- Qué hacer: `toUnifiedTask(task: TodoistTask, projectsById: Map<string, TodoistProject>): UnifiedTaskDto`.
  - `id` → `tdo-${task.id}`
  - `title` → `task.content`
  - `dueDate` → `task.due?.date` o `undefined`
  - `priority` → mapear `1..4` (Todoist) a `TaskPriority` (4=high, 3=medium, 2=low, 1=none).
  - `list` → `projectsById.get(task.project_id)?.name`
  - `completed` → `task.is_completed` (Todoist V2: `is_completed`).
  - `source` → `TaskSource.TODOIST`.

### Tarea 3.C: TodoistSource

- Archivo: `src/modules/tasks/sources/todoist/todoist.source.ts` (crear)
- Qué hacer:
  - `@Injectable()` que implementa `TaskSource`.
  - `name = TaskSource.TODOIST`.
  - `fetch()`: en paralelo `getTasks()` + `getProjects()` con `Promise.all`. Construir `Map<id, project>`. Mapear cada task.
  - Si el cliente lanza → log.error y retornar `[]` (degradación grácil, mismo criterio que Reminders).

### Tarea 3.D: Cableado

- Archivo: `src/modules/tasks/tasks.module.ts` (modificar) — agregar `TodoistClient`, `TodoistSource` a `providers`.
- Archivo: `src/modules/tasks/tasks.service.ts` (modificar) — inyectar `TodoistSource`, en `getTasks()` ejecutar ambas fuentes con `Promise.all` y concatenar.

### Tarea 3.E: Tests

- Archivo: `src/modules/tasks/sources/todoist/todoist.mapper.spec.ts` (crear) — los 4 niveles de priority, due ausente, project ausente.
- Archivo: `src/modules/tasks/sources/todoist/todoist.client.spec.ts` (crear) — mockear `global.fetch`, verificar header bearer, manejo de 401/429/500.

## Criterios de Aceptación

- [ ] Con `TODOIST_API_TOKEN` válido, `GET /api/v1/tasks` mezcla tareas de ambas fuentes.
- [ ] IDs colisionables están namespaced (`rem-` / `tdo-`).
- [ ] Si Todoist devuelve 401, el endpoint retorna las tareas de Reminders y loguea el error (no 500).
- [ ] Sin token → arranque falla en validación Joi de `EnvModule` (definido en FASE_0).
- [ ] `pnpm test` cubre mapper y client.
