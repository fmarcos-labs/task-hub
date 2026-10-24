# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`task-hub` es una API REST NestJS corriendo en el Mac Mini personal que unifica tareas de Apple Reminders y Todoist en un solo endpoint. Está en producción en `tasks.fmarcos.dev` vía Cloudflare Tunnel y es consumida por Hermes (skill `kz_tasks` en `~/.hermes/skills/productivity/kz_tasks/` del Mac Mini, y su cron «Pending Tasks» de las 05:00) para responder consultas de tareas desde Telegram. Antes la consumía OpenClaw.

`GET /api/v1/tasks` acepta `?source=todoist|reminders` opcional para filtrar por fuente. Sin el param devuelve todas.

**Estado actual (2026-04-29):**

- ✅ PM2 corriendo en puerto 3002
- ✅ `tasks.fmarcos.dev` activo
- ✅ Todoist API v1 con paginación completa (139+ tareas)
- ✅ Hermes `kz_tasks` consume `GET /api/v1/tasks`
- ⏳ Apple Reminders: requiere `remindctl authorize` presencial (permisos TCC)
- Deploy automático: push a `main` en `fmarcos-labs` → runner `mac-mini` → `pnpm build` → `rsync` a `~/apps/task-hub` → `pm2 reload`. El repo es **público**: el runner group de `fmarcos-labs` tiene que permitir repos públicos, o el job queda 24 h en cola y se cancela (pasó del 2026-04-30 al 2026-10-24: producción quedó en `174a9a4`)

## Comandos

Gestor: **pnpm**. Node 22.

| Comando           | Uso                                                  |
| ----------------- | ---------------------------------------------------- |
| `pnpm dev`        | Watch mode (`nest start --watch`)                    |
| `pnpm build`      | `nest build && tsc-alias` (resuelve aliases en dist) |
| `pnpm start:prod` | Ejecutar `dist/main.js`                              |
| `pnpm lint`       | ESLint + Prettier con `--fix`                        |
| `pnpm type-check` | `tsc --noEmit`                                       |
| `pnpm test`       | Jest unitarios (`*.spec.ts` bajo `src/`)             |
| `pnpm test:cov`   | Tests con coverage                                   |

Correr un test único: `pnpm test -- src/health/health.controller.spec.ts` (o `-t "<nombre>"`).

Pipeline de commits: husky + lint-staged corre `eslint --fix` + `prettier --write` sobre archivos staged.

## Arquitectura

```
Telegram → Hermes (kz_tasks) → GET http://localhost:3002/api/v1/tasks
                                        ↓
                           TasksCacheService (in-memory, refresh 5min)
                                   ↙           ↘
                        RemindersSource      TodoistSource
                        (remindctl CLI)    (Todoist API v1,
                                           paginación completa)
```

NestJS sobre Fastify. Bootstrap en `src/main.ts`: Helmet, CORS, Swagger en `/docs`, prefijo `api/v1`.

### Módulos

- **`EnvModule`** — `@nestjs/config` + Joi. Siempre usar `ENV_KEYS` en `src/config/env.constants.ts`, nunca strings literales.
- **`TasksModule`** — `TasksController` → `TasksService` → `TasksCacheService` → `[RemindersSource, TodoistSource]`
- **`HealthModule`** — importa `TasksModule` para acceder a `TasksCacheService` (está en `exports`)
- Globales: `GlobalExceptionFilter`, `ResponseInterceptor`, `GLOBAL_VALIDATION_PIPE`, `ThrottlerGuard`

### Fuentes de datos

| Fuente          | Archivo                                 | Notas                                                |
| --------------- | --------------------------------------- | ---------------------------------------------------- |
| Apple Reminders | `sources/reminders/remindctl.runner.ts` | Lee stdout de `remindctl list --json`                |
| Todoist         | `sources/todoist/todoist.client.ts`     | Loop `do/while` con `next_cursor` hasta paginar todo |

### Path aliases

`@modules/*`, `@common/*`, `@config/*`, `@database/*` — definidos en `tsconfig.json`, replicados en `jest.moduleNameMapper`.

## Reglas aprendidas

- **NestJS multi-injection no funciona con el mismo token**: registrar `{ provide: TOKEN, useExisting: X }` dos veces hace que solo el último gane. Para inyectar una colección: recibir cada dependencia individualmente en el constructor y armar el array manualmente.
- **Actualizar specs al cambiar interfaces**: al renombrar campos de un type/interface, buscar y corregir todos los `*.spec.ts` que usen ese tipo como fixture — el compilador no siempre detecta fixtures con casteos parciales.
- **Todoist API v1**: base URL `https://api.todoist.com/api/v1`. Respuestas paginadas con `{ results: [], next_cursor: string|null }`. La `rest/v2` devuelve 410 Gone.
- **remindctl**: no tiene flag `--output`. Leer siempre desde stdout del proceso.
- **Simetría entre fuentes (`ITaskSource`)**: al agregar filtrado en una fuente, verificar que TODAS las implementaciones de la interfaz apliquen el mismo filtro. Un filtro en `RemindersSource` ausente en `TodoistSource` es un bug silencioso.
- **Decoradores HTTP solo en controllers**: `@Query()`, `@Res()`, `@Body()`, `@Param()` nunca van en services. Los services son injectable puro sin awareness HTTP — reciben valores ya parseados como argumentos normales.
- **`pm2 reload` recarga desde la carpeta donde se registró el proceso, no desde el workspace del runner.** task-hub corre desde `~/apps/task-hub`; un deploy que compila en `_work/` y hace `pm2 reload` sale verde y deja el código viejo. Por eso `deploy.yml` sincroniza con `rsync` a `~/apps/task-hub` antes del reload (mismo patrón que `fmarcosdev.api.gateway`).
- **Barrel exports (`index.ts`) sin extensión**: los re-exports en archivos barrel no llevan `.js` ni `.ts` (ej: `export * from './foo'`). La extensión `.js` va en imports directos de módulos, no en barrels.

## Convenciones específicas

- **Imports con `.js`** en código fuente TS (ej: `from '@config/env.constants.js'`). ESM/NodeNext — no quitar la extensión.
- **`crypto.randomUUID()`** para IDs.
- **Env access**: siempre `config.get(ENV_KEYS.X, default)`. Variable nueva → agregar a `ENV_KEYS`, schema Joi y `.env.example`.
- **Errores**: excepciones de `@nestjs/common` o custom de `src/common/exceptions/`. No `catch` vacíos.
- **DTOs**: validados por `GLOBAL_VALIDATION_PIPE` (whitelist + transform).
- **`.claude/settings.local.json`** en `.gitignore` antes de guardar credenciales.
