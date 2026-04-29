# Task Hub — Concepto

Dashboard unificado de tareas del Mac Mini personal.

## El problema

Las tareas están distribuidas en dos lugares:
- **Apple Reminders** — recordatorios personales, sincronizados con iPhone
- **Todoist** — tareas de proyectos y trabajo

No hay una vista única que los muestre juntos.

## La solución

Un servidor NestJS corriendo en el Mac Mini que:
1. Lee Apple Reminders via `remindctl` (CLI local con TCC ya autorizado)
2. Consulta Todoist REST API
3. Unifica ambas fuentes en un solo endpoint
4. Sirve un dashboard web accesible desde browser e iPhone

## Arquitectura

```
Mac Mini
├── remindctl (subprocess --json)  ──┐
│                                    ├──▶ NestJS Server (puerto 3002)
└── Todoist REST API v2              ─┘       │
                                             ├── GET /api/v1/tasks
                                             ├── GET /api/v1/tasks/refresh
                                             ├── GET /api/v1/health
                                             └── GET /docs  (Swagger)
                                                      │
                                        tasks.fmarcos.dev (Cloudflare Tunnel)
                                        accesible: browser + iPhone
```

## Stack

- **Runtime**: Node.js v22 (Homebrew, fijo en el sistema)
- **Framework**: NestJS v11 + Fastify adapter
- **Docs**: Swagger en `/docs`
- **Proceso**: PM2 (ya corriendo en el Mac Mini)
- **Túnel**: Cloudflare (ya configurado en `mac-mini`)

## Formato unificado de tarea

```json
{
  "id": "rem-abc123",
  "title": "Revisar propuesta",
  "dueDate": "2026-04-30",
  "source": "reminders",
  "priority": "medium",
  "list": "Trabajo",
  "completed": false
}
```

`source`: `"reminders"` | `"todoist"`
`priority`: `"none"` | `"low"` | `"medium"` | `"high"`

## Caché

- Datos en memoria
- Refresh automático cada **5 minutos**
- Endpoint `/api/v1/tasks/refresh` para forzar actualización manual

## Variables de entorno (.env)

```env
NODE_ENV=development
PORT=3002
TODOIST_API_TOKEN=<tu token>
CACHE_TTL_SECONDS=300
CORS_ORIGINS=http://localhost:3002,https://tasks.fmarcos.dev
PINO_LOG_LEVEL=info
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

## Cloudflare Tunnel

Agregar a `~/.cloudflared/config.yml`:
```yaml
- hostname: tasks.fmarcos.dev
  service: http://localhost:3002
```

Luego:
```bash
cloudflared tunnel route dns mac-mini tasks.fmarcos.dev
launchctl unload ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
launchctl load  ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
```

## PM2

```bash
cd ~/apps/task-hub
npm ci
npm run build
pm2 start dist/main.js --name task-hub
pm2 save
```

## Checklist de implementación

- [ ] Adaptar template: renombrar, quitar Prisma/DB, quitar ExampleModule
- [ ] Agregar ENV_KEYS para TODOIST_API_TOKEN y CACHE_TTL_SECONDS
- [ ] Crear `TasksModule` con controller + service
- [ ] Implementar `fetchReminders()` via remindctl subprocess
- [ ] Implementar `fetchTodoist()` via REST API
- [ ] Caché en memoria con refresh periódico
- [ ] Swagger documentado
- [ ] Health endpoint sin DB
- [ ] .env configurado con token real
- [ ] PM2 corriendo
- [ ] Cloudflare tunnel apuntando a puerto 3002
