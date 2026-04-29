# Diagramas de Secuencia

Propósito: contratos críticos de interacción. Actualizar solo si cambia el flujo.

## GET /tasks (cache hit)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant CF as Cloudflare Tunnel
    participant C as TasksController
    participant S as TasksService
    participant Cache as TasksCacheService

    U->>CF: GET /api/v1/tasks
    CF->>C: forward
    C->>S: getTasks()
    S->>Cache: getAll()
    Cache-->>S: snapshot UnifiedTask[]
    S-->>C: array
    C-->>U: 200 [tasks]
```

## Refresh periódico (cada CACHE_TTL_SECONDS)

```mermaid
sequenceDiagram
    participant Sch as TasksRefreshScheduler
    participant Cache as TasksCacheService
    participant Rem as RemindersSource
    participant Tod as TodoistSource
    participant CLI as remindctl
    participant API as Todoist API

    Sch->>Cache: refresh()
    par
        Cache->>Rem: fetch()
        Rem->>CLI: execFile list --json
        CLI-->>Rem: stdout JSON
        Rem-->>Cache: UnifiedTask[]
    and
        Cache->>Tod: fetch()
        Tod->>API: GET /tasks + /projects (Bearer)
        API-->>Tod: 200 JSON
        Tod-->>Cache: UnifiedTask[]
    end
    Cache->>Cache: merge + lastRefreshAt = now
```

## POST/GET /tasks/refresh (manual) con deduplicación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as TasksController
    participant Cache as TasksCacheService

    U->>C: GET /tasks/refresh
    C->>Cache: refresh()
    alt refreshing != null
        Cache-->>C: await refreshing en curso
    else
        Cache->>Cache: refreshing = run sources()
        Cache-->>C: { count, refreshedAt }
    end
    C-->>U: 200 { count, refreshedAt }
```

## Degradación grácil — fuente caída

```mermaid
sequenceDiagram
    participant Cache as TasksCacheService
    participant Rem as RemindersSource
    participant Tod as TodoistSource
    participant Log as Pino Logger

    Cache->>Rem: fetch()
    Rem--xCache: throw RemindctlError
    Cache->>Log: error("reminders source failed", err)
    Cache->>Tod: fetch()
    Tod-->>Cache: UnifiedTask[] (todoist only)
    Note over Cache: result = todoist tasks; cache mantiene snapshot anterior si todo falla
```
