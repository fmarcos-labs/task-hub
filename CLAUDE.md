# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`task-hub` es una API REST NestJS corriendo en el Mac Mini personal que unifica tareas de Apple Reminders y Todoist en un solo endpoint. Está en producción en `tasks.fmarcos.dev` vía Cloudflare Tunnel y es consumida por una skill de OpenClaw (`~/.openclaw/workspace/skills/task-hub/`) para responder consultas de tareas desde Telegram.

**Estado actual (2026-04-29):**

- ✅ PM2 corriendo en puerto 3002
- ✅ `tasks.fmarcos.dev` activo
- ✅ Todoist API v1 con paginación completa (139+ tareas)
- ✅ OpenClaw skill funcionando (`openclaw skills list` muestra `task-hub: ready`)
- ⏳ Apple Reminders: requiere `remindctl authorize` presencial (permisos TCC)
- ✅ Deploy automático: push a `main` en `fmarcos-labs` → runner → `pnpm build` → `pm2 reload`

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
Telegram → OpenClaw skill → GET http://localhost:3002/api/v1/tasks
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

## Convenciones específicas

- **Imports con `.js`** en código fuente TS (ej: `from '@config/env.constants.js'`). ESM/NodeNext — no quitar la extensión.
- **`crypto.randomUUID()`** para IDs.
- **Env access**: siempre `config.get(ENV_KEYS.X, default)`. Variable nueva → agregar a `ENV_KEYS`, schema Joi y `.env.example`.
- **Errores**: excepciones de `@nestjs/common` o custom de `src/common/exceptions/`. No `catch` vacíos.
- **DTOs**: validados por `GLOBAL_VALIDATION_PIPE` (whitelist + transform).
- **`.claude/settings.local.json`** en `.gitignore` antes de guardar credenciales.
