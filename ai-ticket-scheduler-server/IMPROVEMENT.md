# Repository Improvement Report — ai-ticket-scheduler-server (Background Worker)

## Current Architecture Overview

The scheduler-server is a **BullMQ worker + cron job engine** with an Express-based admin layer. It consumes `ticket-triage` queue jobs, calls the processor-server via REST for AI triage, and handles failures via a dead-letter handler. Three cron jobs run SLA breach detection, stale ticket auto-closure, and operational metrics snapshots. Bull Board provides a queue monitoring UI at `/admin/queues`. A `/health` endpoint reports Redis and worker status.

**Current structure:**
```
src/
├── index.ts                       # Entry: Express server, Bull Board, /health, graceful shutdown
├── config/
│   ├── config.ts                  # App config parsed from env vars (Redis, SLA, scheduler, ports)
│   ├── metrics.ts                 # Metrics cron config
│   └── sla.ts                     # SLA constants
├── logger.ts                      # Winston via @ai-ticket/shared-lib
├── adapters/
│   ├── processor-adapter.ts       # HTTP to processor-server (with X-Correlation-Id header)
│   └── core-adapter.ts            # HTTP to core-server
├── bull-board/
│   └── index.ts                   # Bull Board UI setup
├── constant/
│   └── service-constant.ts        # STATUS, AUDIT_ACTION, AUDIT_ENTITY, DEFAULT_JOB_OPTIONS
├── handlers/
│   ├── dead-letter.handler.ts     # Dead-letter — marks ticket error_requires_manual, throws on failure
│   └── triage.handler.ts          # Job processor — correlation ID, duration tracking
├── queue/
│   ├── triage.queue.ts            # BullMQ Queue (typed ConnectionOptions)
│   └── triage.worker.ts           # BullMQ Worker (concurrency: 5, completed/failed events)
├── redis/
│   ├── connection.ts              # IORedis connection — exponential backoff, TLS, env-based config
│   └── connection.health.ts       # Redis health check (ping)
├── schedulers/
│   ├── index.ts                   # Starts all schedulers with 5s stagger
│   ├── metrics-snapshot.ts        # Metric snapshot (Promise.allSettled)
│   ├── scheduler-registry.ts      # Register/deregister cron tasks, structured logging with timing
│   ├── scheduler.types.ts         # SchedulerConfig type
│   ├── sla-check.ts               # SLA breach detection cron
│   └── stale-ticket-scan.ts       # Stale ticket auto-close cron (bulk UPDATE, no N+1)
└── docs/
```

## ✅ Improvements Already Made

The following issues from the original audit have been resolved:

| Issue | Original Status | Current Status |
|---|---|---|
| N+1 query in stale ticket scan | Loop with individual updates | Bulk `Ticket.update` with `[affectedCount]` |
| Redis connection error handler | No listener, crash on drop | `error`, `connect` event listeners + `retryStrategy` |
| Redis disconnected on shutdown | Only worker.close() called | `connection.disconnect()` in shutdown handler |
| Dead import `triageQueue` in index.ts | Imported but unused | Removed |
| Misleading `port` log, no HTTP server | Logged port but no listener | Express server with Bull Board + `/health` |
| No health endpoint | Missing | `GET /health` with Redis ping + worker `isRunning()` |
| No Redis config from env | Hardcoded `localhost:6379` | 12 Redis env vars parsed in config |
| Magic SLA thresholds hardcoded | `4 * 60 * 60 * 1000` inline | Configurable via env vars with defaults |
| `Promise.all` in metrics | One failure lost all results | `Promise.allSettled` with fallback to 0 |
| Silent error in dead-letter handler | Error logged, no re-throw | Now `throw err` after logging |
| No stagger between cron jobs | All fired simultaneously | 5s stagger via `setTimeout` |
| No correlation IDs | Missing | `crypto.randomUUID()` in triage handler, forwarded to processor |
| No job timing/duration tracking | Missing | `durationMs` logged in triage handler + scheduler registry |
| Dead config `coreServerUrl` | Defined but never used | Consumed by `core-adapter.ts` |
| Empty reserved directories | `workers/`, `jobs/`, etc. | Populated with proper files |
| Windows-specific `clean` script | `if exist dist rmdir` | `node -e "fs.rmSync('dist', ...)"` |
| `as any` on status strings | `status: 'error' as any` | `STATUS.ERROR_REQUIRES_MANUAL` constant |
| `as any` on metadata | `metadata: {...} as any` | `satisfies` typed interface |
| No `.dockerignore` | Missing | Exists with git, node_modules, .env exclusions |
| No `.gitignore` | Missing | Exists with standard ignores |
| No Bull Board UI | Missing | `/admin/queues` with BullMQAdapter |
| No `core-adapter.ts` | Missing | Created with correlation ID support |
| Single monolithic scheduler file | All crons in one file | Split into individual files + registry pattern |
| No scheduler types | Missing | `SchedulerConfig` interface defined |
| Express 4 | Using Express 4 | Express 5.2.1 |

## Remaining Folder Structure Issues

- `src/config/` has 3 files. Consider merging if they stay thin, else the split is fine.
- `src/docs/` — keep; no issues.

## Code Quality Improvements

### Type Safety (Remaining Issues)
- **`connection as ConnectionOptions`** in `triage.queue.ts` and `triage.worker.ts` — still an unsafe cast. Type it properly:
  ```typescript
  import type { RedisClient } from 'bullmq';
  const connection: RedisClient = redisConnection; // or wrap
  ```
- **No job data validation** — `triage.handler.ts` destructures `job.data.ticketId` without validating it exists. A malformed job crashes the worker:
  ```typescript
  import { z } from 'zod';
  const jobSchema = z.object({ ticketId: z.string().uuid() });
  const { ticketId } = jobSchema.parse(job.data);
  ```
- **`err: unknown`** in catch blocks is handled with `instanceof Error` check — good pattern, but repeated in 5 places. A small `toErrorString(err: unknown): string` utility would DRY it up.

### Error Handling (Remaining Issues)
- **SLA check still loads ALL matching tickets** into memory — if thousands of tickets breach SLA simultaneously, this causes OOM:
  ```typescript
  // Current: Ticket.findAll(...)
  // Fix: Batch with limit/offset
  const batchSize = 500;
  let offset = 0;
  while (true) {
    const batch = await Ticket.findAll({ where, limit: batchSize, offset });
    if (batch.length === 0) break;
    const audits = batch.map(t => ({ ticketId: t.id, action: ..., ... }));
    await AuditLog.bulkCreate(audits);
    offset += batchSize;
  }
  ```
- **No job timeout for processor adapter** — the worker has `timeout: 30000` in `DEFAULT_JOB_OPTIONS`, but the axios call in `processor-adapter.ts` has no explicit timeout. If the processor hangs, BullMQ will mark the job failed but won't abort the HTTP request (orphaned).
  ```typescript
  axios.post(url, data, { timeout: 25000, headers: ... })
  ```
- **`core-adapter.ts` has no timeout either** — same orphaned request risk.
- **No graceful drain timeout** — `handleShutdown` calls `process.exit(0)` immediately after calling `worker.close()` and `server.close()`. In-flight jobs being processed may be interrupted:
  ```typescript
  const handleShutdown = async () => {
    logger.info('Shutting down scheduler server');
    server.close();
    await worker.close(true); // true = do not wait for running jobs
    stopAllSchedulers();
    connection.disconnect();
    // Give in-flight operations time to complete
    setTimeout(() => process.exit(0), 5000).unref();
  };
  ```

### Validation (Remaining)
- **No input validation on `/health`** endpoint — minor concern but defensive.
- **No `core-adapter.ts` action parameter validation** — `action` is a free string; no whitelist.
- **No pagination in SLA check** — see performance section.

### Logging (Remaining)
- **Correlation ID generated per job but not propagated through scheduler cron tasks** — the `registerScheduler` function generates one per cron run; consistency is good.
- **Consider adding `child` loggers** from winston per-job/per-cron for structured log grouping.
- **No log rotation strategy** — Winston console transport logs to stdout; container runtimes handle this, but if file transport is added later, rotation is needed.

## Performance Optimizations (Remaining)

- **SLA check pagination** — see error handling section. This is the #1 remaining perf issue.
- **Redis connection reuse** — currently a single connection. For high throughput, consider a connection pool or `ioredis` Cluster.
- **Prometheus metrics** — still missing. Add `prom-client` with metrics for:
  - `scheduler_job_duration_seconds{type="triage"}`
  - `scheduler_queue_depth{tier="ticket-triage"}`
  - `scheduler_cron_duration_seconds{task="sla-check"}`
  - `scheduler_dead_letter_count`
  - `scheduler_errors_total`

## Security Enhancements (Remaining)

- **No internal auth between scheduler and processor/core** — the adapters pass correlation IDs but no API key or JWT. Add:
  ```typescript
  headers: {
    ...(correlationId ? { 'X-Correlation-Id': correlationId } : {}),
    'X-Api-Key': config.internalApiKey,
  }
  ```
- **`overrideReason` stores raw `errorMessage`** — could contain PII from downstream errors. Sanitize/filter before storing.
- **Bull Board UI is unauthenticated** — anyone with network access to port 3004 can view/manage queues. Add basic auth or restrict to internal network:
  ```typescript
  app.use('/admin/queues', basicAuth({ users: { admin: config.bullBoardPassword } }));
  ```

## Scalability Recommendations (Remaining)

- **Distributed cron locking** — the scheduler registry has no lock mechanism. In multi-replica deployments, all replicas fire the same cron jobs simultaneously. Use Redis-based distributed locks (e.g., `redlock`):
  ```typescript
  import Redlock from 'redlock';
  const lock = await redlock.acquire([`lock:scheduler:${name}`], 60000);
  try { await taskFunction(); } finally { await lock.release(); }
  ```
- **Queue type switching** — `QUEUE_TYPE` env var documented in `.env.sample` of sibling services but never consumed here. If Kafka is ever needed, this service needs an abstraction layer.
- **Dead-letter queue** — the "dead letter" is just a database status update. Consider using BullMQ's native DLQ mechanism (`removeOnFail` already set to 500, but failed jobs can be moved to a dedicated queue).

## DevOps & Infrastructure Improvements (Remaining)

- **Docker build still broken** — the Dockerfile copies `package.json` and `tsconfig.json` but does not include `../ai-ticket-shared-schema` or `../ai-ticket-shared-lib`. `npm install` will fail with `ENOENT` for the `file:` dependency paths:
  ```dockerfile
  # Fix: build from monorepo root or copy shared deps
  COPY package.json tsconfig.json ./
  COPY ../ai-ticket-shared-schema /app/ai-ticket-shared-schema
  COPY ../ai-ticket-shared-lib /app/ai-ticket-shared-lib
  RUN npm install --install-strategy=nested
  ```
- **No `HEALTHCHECK`** in Dockerfile:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3004/health', r => process.exit(r.statusCode===200?0:1))"
  ```
- **No non-root user** in Dockerfile:
  ```dockerfile
  USER node
  ```
- **No OpenTelemetry** — correlation IDs exist but no trace propagation to downstream services.

## Testing Improvements (Remaining)

- **No test framework** — vitest or jest is still absent.
- **Test targets:**
  - `triage.handler.ts` — mock `callProcessorService`, verify correlation ID generation and duration logging
  - `dead-letter.handler.ts` — mock `Ticket.update` and `AuditLog.create`, test both success and error paths
  - `processor-adapter.ts` — mock axios, verify headers and timeout
  - `core-adapter.ts` — same pattern
  - `scheduler-registry.ts` — verify registration, execution, error handling, stop
  - `sla-check.ts` — mock `Ticket.findAll`, verify audit log creation
  - `stale-ticket-scan.ts` — mock `Ticket.update`, verify affected count logging
  - `metrics-snapshot.ts` — mock `Promise.allSettled`, verify fallback on failure
  - `redis/connection.health.ts` — mock `connection.ping()`
- **Integration tests:**
  - With `testcontainers` for Redis + PostgreSQL
  - Full flow: enqueue job → worker processes → processor adapter called → dead-letter on failure

## Developer Experience Improvements (Remaining)

- **Add ESLint + Prettier** — `lint` script is still `echo 'lint ok'`
- **Add `nodemon.json`** for development hot-reload (though `ts-node-dev` is used and works)
- **Add `docker-compose.scheduler.yml`** for local infra (Redis)
- **Add `scripts/` directory** with helper shell scripts for common operations

## Suggested New Features (Remaining)

- **Admin force-retry endpoint** — `POST /admin/retry/:ticketId` to re-enqueue a failed triage job
- **Job status endpoint** — `GET /admin/jobs/:queueName` to query BullMQ job states
- **Configurable SLA policies from DB** — read from `SLAPolicy` table instead of env vars
- **Cron job failure alerts** — emit audit event or webhook when a cron task fails repeatedly
- **Webhook delivery worker** — consume `webhook-delivery` queue when `WebhookSubscription` model events fire
- **Metrics dashboard** — emit Prometheus metrics (see performance section) for Grafana dashboards

## Dependency Review (Remaining)

### Missing / Recommended
- `zod` — job data validation
- `prom-client` — Prometheus metrics
- `redlock` — distributed locking for cron jobs
- `express-basic-auth` — Bull Board authentication
- `vitest` + `nock` — testing
- `p-retry` — retry with backoff for adapter calls

### Dead Config
- `SERVICE_NAME` env var is documented in `.env.sample` and read into config... but the config hardcodes `serviceName: 'scheduler-server'`. The env var is ignored. Either consume it or remove it from `.env.sample`.

## Priority Roadmap

### High Priority
1. **Fix Docker build** — shared packages missing from build context (Dockerfile)
2. **Add pagination to SLA breach check** — `findAll` without limit causes OOM at scale
3. **Add axios timeouts** — `processor-adapter.ts` and `core-adapter.ts` can hang indefinitely
4. **Add job data validation** — validate `ticketId` presence in `triage.handler.ts`
5. **Add distributed cron locking** — prevent duplicate execution in multi-replica deployments
6. **Add graceful drain timeout** — don't `process.exit(0)` mid-job during shutdown
7. **Fix `connection as ConnectionOptions`** — properly type Redis connection for BullMQ v5

### Medium Priority
8. Add Prometheus metrics (queue depth, processing duration, error count)
9. Add Bull Board authentication (basic auth)
10. Add internal API key auth for adapter calls
11. Add `HEALTHCHECK` + non-root user to Dockerfile
12. Sanitize error messages in dead-letter handler (PII in `overrideReason`)
13. Add `toErrorString` utility to DRY catch blocks
14. Make `SERVICE_NAME` env var actually consumed, or remove from `.env.sample`

### Low Priority
15. Add test framework and unit/integration tests
16. ESLint + Prettier setup
17. Webhook delivery worker
18. Admin force-retry endpoint
19. Configurable SLA from DB table
20. OpenTelemetry trace propagation
