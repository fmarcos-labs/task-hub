# FASE 0: Adaptar plantilla template-nest a task-hub

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: —

Eliminar el andamiaje de la plantilla (Prisma, DB, módulo Example) y dejar el repo como base limpia para `TasksModule`.

## Orden de ejecución

1. Tarea 0.A — Eliminar `prisma/`, `src/database/`, módulo Example, `DATABASE_URL` (cambio destructivo, base de todo lo demás).
2. Tarea 0.B — Renombrar paquete y limpiar imports muertos en `app.module.ts`, `tsconfig.json`, `jest`.
3. Tarea 0.C — Ajustar `.env.example` y `ENV_KEYS` con las nuevas variables (`TODOIST_API_TOKEN`, `CACHE_TTL_SECONDS`, `PORT=3002`).
4. Tarea 0.D — Actualizar tests/CI: eliminar dependencias de Postgres en e2e y workflow.
5. Tarea 0.E — Actualizar `README.md` para describir task-hub (no la plantilla).

## Tareas

### Tarea 0.A: Eliminar capa de persistencia

- Archivos a eliminar:
  - `prisma/` (carpeta completa)
  - `prisma.config.ts`
  - `src/database/` (carpeta completa)
  - `src/modules/example/` (carpeta completa)
- Archivos a modificar:
  - `src/app.module.ts` → quitar `DatabaseModule`, `ExampleModule` de `imports`.
  - `src/health/health.controller.ts` → quitar dependencia de `PrismaService`. El health solo verifica uptime + (más adelante) estado del cache.
  - `src/health/health.controller.spec.ts` → eliminar tests de DB; mantener test de `200 OK` con uptime.
  - `package.json` → quitar `@prisma/adapter-pg`, `@prisma/client`, `prisma`, `pg`, `@types/pg`. Quitar scripts `prisma:*`.
  - `package.json` → quitar `@modules/`, `@common/`, `@config/`, `@database/` aliases solo si se elimina `@database`. Mantener los otros.
  - `tsconfig.json` → quitar alias `@database/*`.
  - `jest.moduleNameMapper` (en `package.json`) → quitar `@database/(.*)`.
  - `docker-compose.yml` → quitar service `postgres` (task-hub no usa DB).
  - `Dockerfile` → quitar pasos relacionados a `prisma generate`.
- Referencia: estructura post-borrado debe quedar `src/{common,config,health,modules}` + `main.ts` + `app.module.ts`.

### Tarea 0.B: Renombrar paquete

- Archivo: `package.json`
  - `"name": "task-hub"`, `"version": "0.1.0"`, `"description": "Dashboard unificado Reminders + Todoist"`.
- Archivo: `nest-cli.json`
  - Si `sourceRoot` o nombre referencian `template-nest`, ajustar.
- Archivo: `src/main.ts`
  - `setTitle('task-hub API')` y descripción del DocumentBuilder.

### Tarea 0.C: Variables de entorno

- Archivo: `src/config/env.constants.ts`
  - Quitar `DATABASE_URL`.
  - Agregar `TODOIST_API_TOKEN`, `CACHE_TTL_SECONDS`.
  - `PORT` default 3002.
- Archivo: `src/config/env.module.ts`
  - Quitar validación Joi de `DATABASE_URL`.
  - Agregar `TODOIST_API_TOKEN: Joi.string().required()`.
  - Agregar `CACHE_TTL_SECONDS: Joi.number().integer().positive().default(300)`.
  - `PORT: Joi.number().default(3002)`.
- Archivo: `.env.example`
  - Reemplazar bloque `Database` por `Todoist` (token).
  - Agregar `CACHE_TTL_SECONDS=300`.
  - `PORT=3002`.
  - `CORS_ORIGINS=http://localhost:3002,https://tasks.fmarcos.dev`.

### Tarea 0.D: CI + tests

- Archivo: `test/app.e2e-spec.ts` → adaptar al nuevo `/api/v1/health` sin DB.
- Archivo: `.github/workflows/*.yml` → quitar service `postgres`, quitar pasos `prisma migrate deploy` y `prisma:generate`.
- Verificar: `pnpm install && pnpm lint && pnpm build && pnpm test && pnpm test:e2e` pasan limpios sin DB.

### Tarea 0.E: README

- Archivo: `README.md` (rewrite)
  - Describir task-hub (no template-nest), Quick Start con PM2/Cloudflare, sin Postgres, endpoints reales (`/tasks`, `/tasks/refresh`, `/health`).
  - Mantener formato de tablas de la plantilla.

## Criterios de Aceptación

- [ ] No queda ninguna referencia a Prisma/Postgres/`DATABASE_URL` en src/, package.json, CI ni README.
- [ ] `pnpm install && pnpm build && pnpm test && pnpm test:e2e` corren limpios sin DB.
- [ ] `app.module.ts` solo importa `EnvModule`, `LoggerModule`, `ThrottlerModule`, `HealthModule` (más `TasksModule` cuando exista).
- [ ] `.env.example` documenta exactamente las vars del concepto (incluye `TODOIST_API_TOKEN`, `CACHE_TTL_SECONDS`, `PORT=3002`).
- [ ] CI pasa sin service Postgres.
