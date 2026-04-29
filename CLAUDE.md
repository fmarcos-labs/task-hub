# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`task-hub` es un dashboard unificado de tareas (Apple Reminders + Todoist) que correrá en un Mac Mini personal vía PM2 y Cloudflare Tunnel (`tasks.fmarcos.dev`). Ver `concepto.md` para arquitectura objetivo y checklist de implementación.

El repo arranca desde la base `template-nest` (NestJS + Fastify + Prisma + PostgreSQL). Todavía contiene andamiaje de la plantilla (`prisma/`, módulo `Example`, `DATABASE_URL`) que debe **adaptarse o eliminarse** al implementar el dominio real (`TasksModule`, sin DB, puerto 3002, token de Todoist). El `README.md` describe la plantilla, no el producto final.

## Comandos

Gestor: **pnpm**. Node 22.

| Comando                | Uso                                                       |
| ---------------------- | --------------------------------------------------------- |
| `pnpm dev`             | Watch mode (`nest start --watch`)                         |
| `pnpm build`           | `nest build && tsc-alias` (resuelve aliases en dist)      |
| `pnpm start:prod`      | Ejecutar `dist/main.js`                                   |
| `pnpm lint`            | ESLint + Prettier con `--fix`                             |
| `pnpm type-check`      | `tsc --noEmit`                                            |
| `pnpm test`            | Jest unitarios (`*.spec.ts` bajo `src/`)                  |
| `pnpm test:cov`        | Tests con coverage                                        |
| `pnpm test:e2e`        | E2E con `test/jest-e2e.json` (requiere `DATABASE_URL`)    |
| `pnpm prisma:generate` | Generar Prisma client                                     |
| `pnpm prisma:migrate`  | `prisma migrate dev`                                      |

Correr un test único: `pnpm test -- src/health/health.controller.spec.ts` (o `-t "<nombre>"`).

E2E con DB local: `docker compose up -d postgres` y exportar `DATABASE_URL` antes de `pnpm test:e2e`.

Pipeline de commits: husky + lint-staged corre `eslint --fix` + `prettier --write` sobre archivos staged. CI (`.github/workflows`) hace install → prisma generate → lint → build → test → migrate deploy → e2e con Postgres 16 como service.

## Arquitectura

Aplicación NestJS sobre Fastify; bootstrap en `src/main.ts` registra Helmet, CORS desde env, Swagger en `/docs` y prefija todo con `api/v1`.

`AppModule` (`src/app.module.ts`) compone los cross-cutting de forma global:

- **`EnvModule`** — `@nestjs/config` con esquema Joi (validación fail-fast). Las claves de env se leen siempre por la constante `ENV_KEYS` en `src/config/env.constants.ts`, **nunca** por string literal.
- **`LoggerModule` (nestjs-pino)** — `pino-pretty` en dev, JSON en prod, `genReqId` con `crypto.randomUUID()`.
- **`ThrottlerModule`** — store in-memory; ver gap conocido en README para multi-instancia.
- **`DatabaseModule`** — `PrismaService` + `BaseRepository` genérico para CRUD. Solo relevante mientras siga el modelo `Example`; en `task-hub` final probablemente desaparece.
- Globales registrados como providers: `GlobalExceptionFilter` (APP_FILTER), `ResponseInterceptor` (APP_INTERCEPTOR), `GLOBAL_VALIDATION_PIPE` (APP_PIPE), `ThrottlerGuard` (APP_GUARD). Toda respuesta/error pasa por aquí — al añadir endpoints respetar el shape que el interceptor define.

### Layout de un módulo de dominio

`src/modules/example/` es la referencia: `controller` (HTTP + Swagger decorators) → `service` (lógica) → `repository` (extiende `BaseRepository`) → `dto/` (class-validator). El módulo expone su public API por `index.ts` (barrel). Mantener este patrón al crear `TasksModule`.

### Path aliases

`tsconfig.json` define `@modules/*`, `@common/*`, `@config/*`, `@database/*`. Replicados en `jest.moduleNameMapper` y resueltos en build con `tsc-alias`. Imports internos deben usar el alias correspondiente.

## Convenciones específicas

- **Imports con `.js`** en código fuente TS (ej: `from '@config/env.constants.js'`). Es ESM/NodeNext — no quitar la extensión.
- **`crypto.randomUUID()`** para IDs (no `Math.random()` ni `Date.now()`-based).
- **Env access**: siempre `config.get(ENV_KEYS.X, default)`. Toda variable nueva debe agregarse a `ENV_KEYS`, al schema Joi en `EnvModule`, y a `.env.example`.
- **Errores**: lanzar excepciones de `@nestjs/common` o las custom de `src/common/exceptions/`; el `GlobalExceptionFilter` las normaliza. No `catch` vacíos.
- **DTOs**: validados por el `GLOBAL_VALIDATION_PIPE` (whitelist + transform); declarar tipos con `class-validator` en `dto/`.
- **`.claude/settings.local.json`** debe estar en `.gitignore` antes de guardar credenciales.
