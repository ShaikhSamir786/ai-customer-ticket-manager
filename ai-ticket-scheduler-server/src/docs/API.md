# ai-ticket-scheduler-server — Background Worker & Dashboard

This service runs as a background worker using BullMQ (Redis-backed job queues) and scheduled cron jobs. It also hosts the **BullMQ Dashboard (Bull Board)** web interface and a **health check endpoint**.

## HTTP Endpoints

The service starts an Express server listening on the configured port.

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check — returns Redis connectivity, worker status, and service state |
| `/admin/queues` | GET | Bull Board dashboard — inspect queues, workers, job attempts, retry, history |

### Health Endpoint

`GET /health` — Used by orchestrators and monitoring tools.

```json
{
  "status": "healthy",
  "service": "scheduler-server",
  "timestamp": "2026-06-06T12:00:00.000Z",
  "checks": {
    "redis": "up",
    "worker": "running"
  }
}
```

- **200** — All checks pass (`redis: up`, `worker: running`)
- **503** — Redis is unreachable (`status: degraded`, `redis: down`)

### Bull Board Dashboard

- **URL:** `http://localhost:3004/admin/queues` (Port configurable via `SCHEDULER_SERVER_PORT`).
- **Endpoint:** `/admin/queues` - Renders the Bull Board dashboard containing queues, workers, job attempts, retry management, and history.

## Architecture

```
Core Server (enqueues job)
       |
       v
  [Redis: ticket-triage queue]
       |
  Scheduler Worker (concurrency: 5, consumes job via triageJobHandler)
       |   (correlation ID propagated via X-Correlation-Id header)
       v
  Processor Server (REST POST /v1/triage/process)
       |
       v
  Core Server (REST POST /v1/tickets/update-triage)
```

---

## Queue: `ticket-triage`

Processes tickets asynchronously after they are created in `core-server`.

### Job Payload

```json
{
  "ticketId": "clx123abc"
}
```

### Job Flow

1. Worker picks up the job from the BullMQ `ticket-triage` queue (see [triage.worker.ts](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-scheduler-server/src/queue/triage.worker.ts)) — up to **5 concurrent** jobs (configurable via `concurrency` option)
2. Executes the job processor logic in [triage.handler.ts](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-scheduler-server/src/handlers/triage.handler.ts):
   - Generates a **correlation ID** (`crypto.randomUUID()`) for the job
   - Logs start with job ID, ticket ID, correlation ID, attempt count, and max attempts
   - Measures and logs processing **duration in milliseconds**
3. Calls `process-server` via `POST /v1/triage/process` with `X-Correlation-Id` header
4. On success — logs completion with duration, attempt count
5. On failure — retries up to 3 times (with exponential backoff), then moves to the dead-letter handler

### Default Job Options (`DEFAULT_JOB_OPTIONS`)

| Option | Value |
|---|---|
| `attempts` | 3 |
| `backoff` | exponential (delay: 1000ms) |
| `timeout` | 30000ms |
| `removeOnComplete` | 100 (keep last 100 complete jobs) |
| `removeOnFail` | 500 (keep last 500 fail jobs) |

---

## Cron Schedulers

All schedulers are registered dynamically through [scheduler-registry.ts](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-scheduler-server/src/schedulers/scheduler-registry.ts) and can be configured using environment variables.

### SLA Breach Check
- **Cron Expression:** `SLA_CHECK_CRON` (default: `*/5 * * * *` / every 5 minutes)
- **Cutoff Age:** `SLA_THRESHOLD_MS` (default: `14400000` / 4 hours)
- **Logic:** Scans tickets in `pending`, `triaging`, or `assigned` status that were created older than the threshold.
- **Action:** Creates an `AuditLog` entry with action `sla.breached`.

```json
{
  "ticketId": "clx123abc",
  "action": "sla.breached",
  "entity": "ticket",
  "entityId": "clx123abc",
  "metadata": {
    "createdAt": "2026-06-05T06:00:00.000Z",
    "currentStatus": "pending"
  }
}
```

### Stale Ticket Scan
- **Cron Expression:** `STALE_TICKET_SCAN_CRON` (default: `*/15 * * * *` / every 15 minutes)
- **Stale Limit:** `STALE_TICKET_THRESHOLD_MS` (default: `604800000` / 7 days)
- **Logic:** Bulk-updates tickets in `waiting_customer` status with `updatedAt` older than the threshold (fixes N+1 query — single `UPDATE` instead of loop).
- **Action:** Auto-closes matched tickets (`status → closed`) and logs the affected count.

```json
{
  "ticketId": "clx123abc",
  "action": "ticket.auto_closed",
  "reason": "No customer response for 7 days"
}
```

### Metrics Snapshot
- **Cron Expression:** `METRICS_SNAPSHOT_CRON` (default: `0 */6 * * *` / every 6 hours)
- **Logic:** Gathers operational counts using `Promise.allSettled` (prevents one failed count from losing all results) and writes them to an `AuditLog` entry with action `metrics.snapshot`. Failed counts default to `0`.

```json
{
  "action": "metrics.snapshot",
  "entity": "system",
  "entityId": "metrics",
  "metadata": {
    "pending": 5,
    "inProgress": 12,
    "resolved": 48,
    "needsReview": 3,
    "timestamp": "2026-06-05T12:00:00.000Z"
  }
}
```

---

## Configuration

All settings are loaded from `src/config/config.ts` via `@ai-ticket/shared-lib`'s `loadConfig()`, with overrides through environment variables.

### Redis

| Env Var | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `REDIS_PORT` | *(from URL)* | Override port independently of the URL |
| `REDIS_MAX_RETRIES_PER_REQUEST` | `null` | IORedis retry limit per request (keep `null` for BullMQ) |
| `REDIS_CONNECT_TIMEOUT_MS` | `10000` | Connection timeout in ms |
| `REDIS_MAX_RETRY_ATTEMPTS` | `10` | Max reconnection attempts before giving up |
| `REDIS_RETRY_DELAY_MS` | `1000` | Base retry delay (exponential backoff, 2x cap 30s) |
| `REDIS_KEEPALIVE_MS` | `30000` | TCP keep-alive interval |
| `REDIS_ENABLE_READY_CHECK` | `true` | Run ready check on connect |
| `REDIS_TLS_ENABLED` | `false` | Enable TLS mode |

### Scheduler Stagger

Cron jobs start with a **5-second stagger** between each other to prevent simultaneous database load:
1. SLA Breach Check — starts immediately
2. Stale Ticket Scan — starts after 5s
3. Metrics Snapshot — starts after 10s

## Handlers

### Dead-Letter Handler (`dead-letter.handler.ts`)

Triggered when a triage job exhausts all retry attempts.

**Action:**
1. Sets the ticket status to `error_requires_manual` with `overrideReason` describing the failure
2. Creates an `AuditLog` entry with action `triage.dead_letter`
3. **Throws on failure** — no longer silently swallows errors (ensures the failure is observable via monitoring)
