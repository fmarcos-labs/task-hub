# FASE 5: Health endpoint + Swagger consolidado

**Status**: ⏸️ PENDIENTE
**Prioridad**: Media
**Dependencias**: FASE_4

Adaptar el health a la realidad sin DB y revisar la documentación Swagger completa.

## Tareas

### Tarea 5.A: Health sin DB

- Archivo: `src/health/health.controller.ts` (modificar)
- Qué hacer: retornar
  ```json
  {
    "status": "ok",
    "uptime": <process.uptime()>,
    "timestamp": "<ISO>",
    "cache": {
      "lastRefreshAt": "<ISO|null>",
      "ageSeconds": <number|null>,
      "taskCount": <number>
    }
  }
  ```
- Inyectar `TasksCacheService` y exponer su estado read-only.
- Status `degraded` (HTTP 503) si `lastRefreshAt` es `null` y han pasado más de `2 * CACHE_TTL_SECONDS` desde `boot`.

### Tarea 5.B: Test del health

- Archivo: `src/health/health.controller.spec.ts` (modificar)
- Cubrir: caso ok con cache poblado, caso degraded sin refresh inicial.

### Tarea 5.C: Revisión Swagger

- Verificar que `/docs` muestre:
  - `GET /api/v1/health` con schema completo del response.
  - `GET /api/v1/tasks` con `[UnifiedTaskDto]`.
  - `GET /api/v1/tasks/refresh` con schema `{ count, refreshedAt }`.
- Decorar enums y campos opcionales con `@ApiPropertyOptional` donde aplique.

## Criterios de Aceptación

- [ ] `GET /api/v1/health` HTTP 200 con info de caché.
- [ ] HTTP 503 cuando el caché nunca refrescó tras `2*TTL`.
- [ ] Swagger UI documenta los 3 endpoints con tipos correctos.
- [ ] E2E test cubre `/health`.
