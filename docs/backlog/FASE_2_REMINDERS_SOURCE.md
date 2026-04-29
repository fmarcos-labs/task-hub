# FASE 2: Reminders source (remindctl subprocess)

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_1

Implementar la fuente de Apple Reminders ejecutando `remindctl --json` como subprocess y mapeando su salida al DTO unificado.

## Orden de ejecución

1. Tarea 2.A — Wrapper de subprocess (`runRemindctl`).
2. Tarea 2.B — Mapper `reminders → UnifiedTaskDto`.
3. Tarea 2.C — `RemindersSource` que implementa `TaskSource`.
4. Tarea 2.D — Cablear en `TasksModule` + integrar en `TasksService`.
5. Tarea 2.E — Tests con mock de `child_process`.

## Tareas

### Tarea 2.A: Subprocess wrapper

- Archivo: `src/modules/tasks/sources/reminders/remindctl.runner.ts` (crear)
- Qué hacer:
  - Función async `runRemindctl(): Promise<RemindctlOutput>` que use `child_process.execFile('remindctl', ['list', '--json'])` con `util.promisify`.
  - Timeout configurable (default 10s). Lanzar `RemindctlError` (custom, en `src/common/exceptions/`) si exit code != 0 o si JSON.parse falla.
  - Tipo `RemindctlOutput` derivado de la salida real del CLI (capturar muestra real al implementar).
- Razón: aislar el side-effect del subprocess para poder mockearlo en tests.

### Tarea 2.B: Mapper

- Archivo: `src/modules/tasks/sources/reminders/reminders.mapper.ts` (crear)
- Qué hacer: función pura `toUnifiedTask(reminder: RemindctlReminder): UnifiedTaskDto`. Convierte:
  - `id` → `rem-${reminder.id}` (prefijo namespace para evitar colisión con Todoist)
  - `title` → `reminder.title`
  - `dueDate` → ISO date o `undefined`
  - `priority` → mapear escala numérica de Reminders (0/1/5/9) a `TaskPriority`
  - `list` → `reminder.list?.name`
  - `completed` → `reminder.isCompleted`
  - `source` → `TaskSource.REMINDERS`

### Tarea 2.C: RemindersSource

- Archivo: `src/modules/tasks/sources/reminders/reminders.source.ts` (crear)
- Qué hacer:
  - Clase `@Injectable()` que implementa `TaskSource`.
  - `name = TaskSource.REMINDERS`.
  - `fetch()` llama `runRemindctl()` y mapea cada item con `toUnifiedTask`.
  - Loguea con `Logger` (pino) cantidad de tasks y duración.
  - Si `runRemindctl` lanza, capturar y retornar `[]` + log.error (degradación grácil — no romper el endpoint si Reminders falla).

### Tarea 2.D: Cableado

- Archivo: `src/modules/tasks/tasks.module.ts` (modificar)
- Qué hacer: agregar `RemindersSource` a `providers`.
- Archivo: `src/modules/tasks/tasks.service.ts` (modificar)
- Qué hacer: inyectar `RemindersSource`, llamarlo desde `getTasks()` (temporal hasta FASE 4 que pone caché).

### Tarea 2.E: Tests

- Archivo: `src/modules/tasks/sources/reminders/reminders.mapper.spec.ts` (crear) — tests de pure function: cada caso de `priority`, manejo de `dueDate` ausente, list ausente.
- Archivo: `src/modules/tasks/sources/reminders/reminders.source.spec.ts` (crear) — mockear `runRemindctl`, verificar que retorna `[]` ante error y array mapeado en happy path.

## Criterios de Aceptación

- [ ] `GET /api/v1/tasks` retorna recordatorios reales (en macOS) o array vacío + log.error si `remindctl` no existe en Linux/CI.
- [ ] Tests del mapper cubren los 4 niveles de `priority` y los casos de campos opcionales.
- [ ] `RemindctlError` se loguea con stderr y exit code, sin tirar 500.
- [ ] Todos los IDs de Reminders quedan prefijados con `rem-`.
