# task-hub

Dashboard unificado de tareas: Apple Reminders + Todoist.

## Fases de Desarrollo

| Fase                            | Status        |
| ------------------------------- | ------------- |
| FASE_0: Adaptar plantilla       | ✅ COMPLETADO |
| FASE_1: TasksModule + DTO       | ✅ COMPLETADO |
| FASE_2: Reminders source        | ✅ COMPLETADO |
| FASE_3: Todoist source          | ✅ COMPLETADO |
| FASE_4: Cache + refresh         | ✅ COMPLETADO |
| FASE_5: Health + Swagger        | ⏸️ PENDIENTE  |
| FASE_6: Deploy PM2 + Cloudflare | ⏸️ PENDIENTE  |

## Quick Start

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar TODOIST_API_TOKEN con tu token de Todoist

# 2. Instalar dependencias
pnpm install

# 3. Desarrollo
pnpm dev
```

La app arranca en `http://localhost:3002` y Swagger en `http://localhost:3002/docs`.

## Stack

| Capa          | Tecnologia                          |
| ------------- | ----------------------------------- |
| Framework     | NestJS 11                           |
| HTTP adapter  | Fastify                             |
| Validacion    | class-validator + class-transformer |
| Documentacion | Swagger (GET /docs)                 |
| Logging       | Pino (nestjs-pino)                  |
| Testing       | Jest                                |
| CI            | GitHub Actions                      |

## Scripts

| Script            | Descripcion                    |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Desarrollo con watch mode      |
| `pnpm build`      | Build de produccion            |
| `pnpm start:prod` | Ejecutar build                 |
| `pnpm lint`       | ESLint + Prettier con auto-fix |
| `pnpm test`       | Tests unitarios                |
| `pnpm test:cov`   | Tests con coverage             |

## Endpoints

| Metodo | Path                    | Descripcion               |
| ------ | ----------------------- | ------------------------- |
| GET    | `/api/v1/health`        | Health check              |
| GET    | `/api/v1/tasks`         | Lista unificada de tareas |
| POST   | `/api/v1/tasks/refresh` | Refrescar cache           |
| GET    | `/docs`                 | Swagger UI                |

## Variables de entorno

Ver `.env.example` para la lista completa.

## Deploy

```bash
# Build de imagen
docker build -t task-hub .

# Produccion (PM2 + Cloudflare Tunnel)
pm2 start dist/main.js --name task-hub
```

Puerto por defecto: `3002`

## Licencia

Privado. Todos los derechos reservados.
