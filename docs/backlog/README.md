# Backlog — task-hub

Dashboard unificado de tareas (Apple Reminders + Todoist) corriendo en NestJS sobre Mac Mini, expuesto vía Cloudflare Tunnel.

## Fases

| Fase | Nombre                                                     | Prioridad | Status        | Depende de     |
| ---- | ---------------------------------------------------------- | --------- | ------------- | -------------- |
| 0    | [Adaptar plantilla](FASE_0_BASE.md)                        | Alta      | ✅ COMPLETADO | —              |
| 1    | [TasksModule + DTO unificado](FASE_1_TASKS_MODULE.md)      | Alta      | ✅ COMPLETADO | FASE_0         |
| 2    | [Reminders source (remindctl)](FASE_2_REMINDERS_SOURCE.md) | Alta      | ⏸️ PENDIENTE  | FASE_1         |
| 3    | [Todoist source (REST v2)](FASE_3_TODOIST_SOURCE.md)       | Alta      | ⏸️ PENDIENTE  | FASE_1         |
| 4    | [Caché in-memory + refresh](FASE_4_CACHE_REFRESH.md)       | Alta      | ⏸️ PENDIENTE  | FASE_2, FASE_3 |
| 5    | [Health + Swagger](FASE_5_HEALTH_SWAGGER.md)               | Media     | ⏸️ PENDIENTE  | FASE_4         |
| 6    | [Deploy PM2 + Cloudflare](FASE_6_DEPLOY.md)                | Media     | ⏸️ PENDIENTE  | FASE_5         |

## Diagramas de Referencia

| Archivo                                                                        | Tipo       | Contenido                                                           |
| ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------- |
| [`../diagrams/DIAGRAMAS_COMPONENTES.md`](../diagrams/DIAGRAMAS_COMPONENTES.md) | Flowcharts | Topología: subprocess + REST + cache + tunnel                       |
| [`../diagrams/DIAGRAMAS_SECUENCIA.md`](../diagrams/DIAGRAMAS_SECUENCIA.md)     | Sequences  | GET /tasks (cache hit/miss), POST /tasks/refresh, refresh periódico |

> Los diagramas son referencia estructural estable. Las fases los referencian sin repetirlos. Actualizar solo ante cambios de topología o flujos de negocio.

> Diagrama de estados omitido — no hay entidades con ciclo de vida no trivial (las tareas son read-only desde el dashboard).

## Decisiones Técnicas

Carpeta [`../decisions/`](../decisions/) — documentar aquí decisiones arquitectónicas cuando surjan durante el desarrollo.
Formato: `DECISION_[TEMA].md` — explica el POR QUÉ, no el QUÉ.

## Validación de Flujos

| Archivo                      | Propósito                                                       |
| ---------------------------- | --------------------------------------------------------------- |
| [`../flows.md`](../flows.md) | Flujos de usuario documentados manualmente. Guía para QA y E2E. |

Llenar después de probar cada feature. Usar como referencia con `/run-browser_test`.

## Origen

[`../_CONCEPTO.md`](../_CONCEPTO.md) — concepto inicial del proyecto (inmutable).
