# FASE 4: Caché in-memory + refresh periódico

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_2, FASE_3

Mover la consulta a fuentes a un caché en memoria que se refresca cada `CACHE_TTL_SECONDS` y puede forzarse vía endpoint.

## Orden de ejecución

1. Tarea 4.A — `TasksCacheService` con estado interno.
2. Tarea 4.B — Refresh periódico con `@nestjs/schedule` o `setInterval` en `OnModuleInit`.
3. Tarea 4.C — Refactorizar `TasksService` para usar caché.
4. Tarea 4.D — Test de caché y de refresh manual.

## Tareas

### Tarea 4.A: Caché en memoria

- Archivo: `src/modules/tasks/cache/tasks-cache.service.ts` (crear)
- Qué hacer:
  - Estado privado: `tasks: UnifiedTaskDto[] = []`, `lastRefreshAt: Date | null`, `refreshing: Promise<void> | null` (para deduplicar refreshes concurrentes).
  - Método `getAll(): UnifiedTaskDto[]` — retorna snapshot actual (no llama fuentes).
  - Método `refresh(): Promise<{ count: number; refreshedAt: string }>`:
    - Si ya hay un `refreshing` en curso → esperar al mismo (deduplicate).
    - Sino: ejecutar las fuentes con `Promise.allSettled`, mergear resultados, actualizar estado.
    - Cualquier fuente con `status === 'rejected'` se loguea pero no rompe el merge.
- Inyectar las fuentes con un token de DI (`TASK_SOURCES`) que sea `TaskSource[]` — permite agregar fuentes nuevas sin tocar el caché.

### Tarea 4.B: Refresh periódico

- Decisión a documentar en `docs/decisions/`: `@nestjs/schedule` (declarativo, requiere dep extra) vs `setInterval` en `OnModuleInit/OnModuleDestroy` (cero deps, manual).
- Recomendado: `@nestjs/schedule` con `@Interval(CACHE_TTL_SECONDS * 1000)`.
- Archivo: `src/modules/tasks/cache/tasks-refresh.scheduler.ts` (crear) — `@Injectable()` con `@Interval` que llama `cache.refresh()` y loguea.
- Archivo: `src/app.module.ts` — agregar `ScheduleModule.forRoot()` si se elige esa vía.

### Tarea 4.C: Service usa caché

- Archivo: `src/modules/tasks/tasks.service.ts` (modificar)
- Qué hacer:
  - `getTasks()` → `cache.getAll()`.
  - `refresh()` → `cache.refresh()`.
  - Quitar inyecciones directas de `RemindersSource` / `TodoistSource` del service (ahora viven detrás del caché).

### Tarea 4.D: Tests

- Archivo: `src/modules/tasks/cache/tasks-cache.service.spec.ts` (crear)
- Cubrir:
  - `getAll()` retorna `[]` antes del primer refresh.
  - Después de `refresh()`, `getAll()` retorna concatenación de fuentes mockeadas.
  - Una fuente que rechaza → no rompe el merge; el array contiene solo la fuente exitosa + log.error registrado.
  - Dos `refresh()` concurrentes → las fuentes se llaman una sola vez (deduplicación).

## Criterios de Aceptación

- [ ] `GET /api/v1/tasks` no dispara llamadas externas (lee de caché).
- [ ] `GET /api/v1/tasks/refresh` fuerza refresh y retorna `{ count, refreshedAt }`.
- [ ] Refresh periódico ocurre cada `CACHE_TTL_SECONDS` (default 300).
- [ ] Una fuente caída no degrada la otra.
- [ ] `pnpm test` cubre el caso de deduplicación concurrente.
