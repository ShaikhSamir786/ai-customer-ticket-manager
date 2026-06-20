# ai-ticket-scheduler-server — Folder Structure

```
src/
├── index.ts                       # Entry: Express server, Bull Board, /health endpoint, graceful shutdown
├── config/
│   ├── config.ts                  # App config parsed from env vars (Redis, SLA, scheduler, ports)
│   ├── metrics.ts                 # Metrics cron config
│   └── sla.ts                     # SLA constants
├── logger.ts                      # Winston logger (via @ai-ticket/shared-lib)
│
├── adapters/
│   ├── processor-adapter.ts       # HTTP adapter to processor-server (with X-Correlation-Id header)
│   └── core-adapter.ts            # HTTP adapter to core-server (with X-Correlation-Id header)
│
├── bull-board/
│   └── index.ts                   # BullMQ dashboard setup (Bull Board)
│
├── constant/
│   └── service-constant.ts        # STATUS, AUDIT_ACTION, AUDIT_ENTITY, DEFAULT_JOB_OPTIONS
│
├── handlers/
│   ├── dead-letter.handler.ts     # Dead-letter handler — marks ticket error_requires_manual, throws on failure
│   └── triage.handler.ts          # Job processor — correlation ID, duration tracking, calls processor-adapter
│
├── queue/
│   ├── triage.queue.ts            # BullMQ Queue (properly typed ConnectionOptions)
│   └── triage.worker.ts           # BullMQ Worker (concurrency: 5, completed/failed event listeners)
│
├── redis/
│   ├── connection.ts              # IORedis connection — exponential backoff retry, TLS support, env-based config
│   └── connection.health.ts       # Redis health check (ping)
│
├── schedulers/
│   ├── index.ts                   # Starts all schedulers with 5s stagger
│   ├── metrics-snapshot.ts        # Metric snapshot cron (Promise.allSettled)
│   ├── scheduler-registry.ts      # Registers/deregisters cron tasks, structured logging with duration
│   ├── scheduler.types.ts         # SchedulerConfig type
│   ├── sla-check.ts               # SLA breach detection cron
│   └── stale-ticket-scan.ts       # Stale ticket auto-close cron (bulk UPDATE, no N+1)
│
└── docs/
    ├── API.md                     # HTTP endpoints, queue, cron schedulers, Redis config, handlers
    └── FOLDER_STRUCTURE.md        # This file
```
