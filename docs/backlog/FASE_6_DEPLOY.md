# FASE 6: Deploy — PM2 + Cloudflare Tunnel

**Status**: ⏸️ PENDIENTE
**Prioridad**: Media
**Dependencias**: FASE_5

Dejar la app corriendo en el Mac Mini bajo PM2 y expuesta vía Cloudflare Tunnel en `tasks.fmarcos.dev`.

## Tareas

### Tarea 6.A: ecosystem.config.js para PM2

- Archivo: `ecosystem.config.cjs` (crear en raíz)
- Qué hacer:
  ```js
  module.exports = {
    apps: [{
      name: 'task-hub',
      script: 'dist/main.js',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '256M',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      time: true,
    }]
  };
  ```
- El `.env` se carga desde el directorio del proceso por `@nestjs/config` — verificar que `cwd` sea correcto.

### Tarea 6.B: Deploy en Mac Mini

- En el Mac Mini:
  ```bash
  cd ~/apps/task-hub
  git pull
  pnpm install --prod=false
  pnpm build
  pm2 start ecosystem.config.cjs
  pm2 save
  pm2 logs task-hub
  ```
- Documentar en `README.md` la sección Deploy.

### Tarea 6.C: Cloudflare Tunnel

- Editar `~/.cloudflared/config.yml` en Mac Mini:
  ```yaml
  - hostname: tasks.fmarcos.dev
    service: http://localhost:3002
  ```
- Comandos:
  ```bash
  cloudflared tunnel route dns mac-mini tasks.fmarcos.dev
  launchctl unload ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
  launchctl load  ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
  ```
- Verificar acceso desde browser desktop e iPhone.

### Tarea 6.D: CORS prod

- Archivo: `.env` en Mac Mini → `CORS_ORIGINS=https://tasks.fmarcos.dev`.
- Confirmar en logs que peticiones desde `tasks.fmarcos.dev` no son bloqueadas.

## Criterios de Aceptación

- [ ] `pm2 list` muestra `task-hub` en estado `online`.
- [ ] `curl https://tasks.fmarcos.dev/api/v1/health` → 200.
- [ ] `curl https://tasks.fmarcos.dev/api/v1/tasks` → 200 con tareas reales.
- [ ] Reinicio del Mac Mini: PM2 levanta task-hub automáticamente (`pm2 startup` ya ejecutado).
