# Repository Improvement Report — ai-ticket-scheduler-server (Background Worker)

## Current Architecture Overview

The scheduler-server is a **BullMQ worker + cron job engine** with no HTTP API (it operates purely as a background service). It consumes `ticket-triage` queue jobs, calls the processor-server via REST to perform AI triage, and handles failures via a dead-letter handler. Three cron jobs run SLA breach detection, stale ticket auto-closure, and operational metrics snapshots.

**Current structure:**
```
src/
├── index.ts                    # Entry: start workers + schedulers, graceful shutdown
├── config.ts                   # Config via shared-lib spread
├── logger.ts                   # Winston via shared-lib
├── adapters/
│   └── processor-adapter.ts    # HTTP call to processor-server
├── jobs/
│   └── dead-letter.ts          # Failed job handler (marks ticket + audit)
├── schedulers/
│   └── index.ts                # Cron jobs: SLA, stale scan, metrics
├── workers/
│   └── triage-worker.ts        # BullMQ Worker + Queue definition
└── docs/
```

## Folder Structure Improvements

### Separate Queue Infrastructure from Worker Logic
```
src/
├── index.ts
├── config.ts
├── logger.ts
├── redis/
│   ├── connection.ts           # IORedis connection (extracted from worker)
│   └── connection.health.ts    # Connection health monitoring
├── queue/
│   ├── triage.queue.ts         # Queue definition
│   └── triage.worker.ts        # Worker definition (extracted)
├── adapters/
│   ├── processor-adapter.ts    # HTTP to processor
│   └── core-adapter.ts         # HTTP to core-server (for future use)
├── handlers/
│   ├── triage.handler.ts       # Job processor logic
│   └── dead-letter.handler.ts  # Extracted from jobs/
├── schedulers/
│   ├── index.ts                # Cron jobs: SLA, stale scan, metrics
│   ├── sla-check.ts            # Extracted cron job
│   ├── stale-ticket-scan.ts    # Extracted cron job
│   ├── metrics-snapshot.ts     # Extracted cron job
│   ├── scheduler-registry.ts   # Central cron registration
│   └── scheduler.types.ts      # Types for scheduler config
└── config/
    ├── sla.ts                  # SLA constants (magic numbers removed)
    └── metrics.ts              # Metrics config
```

## Code Quality Improvements

### Type Safety
- **Remove all `as any` casts** — 6+ occurrences across the codebase:
  - `status: 'error_requires_manual' as any` → use proper `TicketStatus.ERROR_REQUIRES_MANUAL` enum
  - `metadata: { ... } as any` → use typed `Metadata` interface
  - `connection: connection as any` in BullMQ Queue/Worker → fix the BullMQ v5 typing
- **Define proper interfaces** for:
  ```typescript
  interface TriageJobData { ticketId: string; }
  interface DeadLetterMetadata { error: string; }
  interface SlaBreachMetadata { createdAt: Date; currentStatus: string; }
  ```
- **Type the BullMQ worker properly** — validate `job.data` at runtime:
  ```typescript
  const schema = z.object({ ticketId: z.string().uuid() });
  const data = schema.parse(job.data);
  ```

### Error Handling
- **Fix silent error swallowing in dead-letter handler** — if `Ticket.update` or `AuditLog.create` fails, the error is logged but lost. The ticket remains in an inconsistent state:
  ```typescript
  // Current: silently catches
  // Fix: throw after logging, or implement a retry queue
  ```
- **Add Redis connection error handler** — current IORedis instance has no `'error'` event listener, which will crash the process if connection drops
- **Properly close Redis connection on shutdown** — currently only `worker.close()` is called, leaving the Redis connection open
- **Add job data validation** — if `ticketId` is missing from job data, the worker crashes with a confusing error
- **Fix `failed` event type signature** for BullMQ v5 (signature may differ from v4)

### Validation
- Validate all cron job query inputs (status, date ranges)
- Add batch processing validation (limit number of tickets processed per cron run)
- Add JSONB schema validation for audit log metadata

### Logging
- Add correlation ID propagation through adapter calls
- Log job processing duration (attempts, retry count)
- Add structured logging for cron job runs with completion status and counts

## Performance Optimizations

- **Fix N+1 query in stale ticket scan** — replace loop with bulk update:
  ```typescript
  await Ticket.update(
    { status: TicketStatus.CLOSED },
    { where: { status: TicketStatus.WAITING_CUSTOMER, updatedAt: { [Op.lte]: cutoffDate } } }
  );
  ```
- **Add pagination to all cron job queries** — use `limit` and `offset` to prevent OOM with large datasets:
  ```typescript
  const batchSize = 1000;
  let offset = 0;
  while (true) {
    const batch = await Ticket.findAll({ where, limit: batchSize, offset });
    if (batch.length === 0) break;
    // process batch
    offset += batchSize;
  }
  ```
- **Add stagger between cron jobs** — use `setTimeout` or staggered cron expressions to prevent simultaneous database load
- **Add job concurrency configuration** — explicit `{ concurrency: 5 }` on Worker for parallel ticket processing
- **Optimize SLA breach query** with composite index on `(status, createdAt)`
- **Use `Promise.allSettled`** for metrics counting to prevent one failed count from losing all results

## Security Enhancements

- **Add internal auth header** when calling processor-server (API key)
- **Sanitize error messages** stored in dead-letter handler — ensure no sensitive data in `overrideReason`
- **Add rate limiting** for metrics snapshot audit log writes (prevent flooding audit_logs table)

## Scalability Recommendations

- **Add Redis connection pooling** — single connection may bottleneck at high throughput
- **Support queue type switching** — `QUEUE_TYPE` env var is defined but never consumed (BullMQ is hardcoded)
- **Add metrics for queue depth and processing latency** to trigger auto-scaling decisions
- **Implement distributed cron locking** (e.g., using Redis-based distributed locks) to prevent duplicate execution in multi-replica deployments
- **Make SLA thresholds configurable** — move magic numbers (`4 * 60 * 60 * 1000`, `7 * 24 * 60 * 60 * 1000`) to environment variables or the SLAPolicy table

## DevOps & Infrastructure Improvements

- **Fix Docker build** — both shared packages must be in build context
- Add `.dockerignore`, `HEALTHCHECK`, non-root user
- Add `/health` endpoint (even though no HTTP routes, keep for K8s probes) — reuse the port config
- Add Prometheus metrics: queue depth, job processing duration, cron execution duration, dead-letter count
- Add graceful drain timeout (don't `process.exit(0)` immediately — wait for in-flight jobs)

## Testing Improvements

- **Add test framework** (vitest) — currently zero test infrastructure
- **Unit tests** for:
  - `applyRulesFallback` (if extracted from core-server)
  - Dead-letter handler (with mocked Sequelize)
  - Adapter calls (with nock)
- **Integration tests** for:
  - Worker processing with mocked processor-server
  - Cron job execution with test database
  - Redis connectivity (with testcontainers)
- **Test critical edge cases**:
  - Worker failure → dead-letter handler → retry logic
  - Stale ticket scan with 0, 1, N tickets
  - SLA breach detection at boundary conditions

## Developer Experience Improvements

- **Fix dead import** — `triageQueue` is imported in `index.ts` but never used there. Either use it or remove the import
- **Remove misleading `config.port`** — no HTTP server is created, yet `port` is logged. Either add a health endpoint or remove
- Add real ESLint config
- Add cross-platform `clean` script
- Add `docker-compose.scheduler.yml` for local development

## Suggested New Features

- **Health endpoint** — return queue depth, worker status, last cron execution timestamps
- **Admin force-retry endpoint** — manually retry failed triage jobs
- **Job queue monitoring** — expose queue metrics via REST (or integrate with existing monitor)
- **Configurable SLA policies** — read from `SLAPolicy` table instead of hardcoded constants
- **Cron job failure alerts** — emit event when cron job fails consistently
- **Metrics dashboard** — store snapshots in time-series format (or integrate with Prometheus)

## Dependency Review

### Dead Config
- `coreServerUrl` defined in config but never used (removed with `CORE_SERVER_URL` from `.env.sample`)
- `port` defined and logged but no HTTP server uses it
- `SERVICE_NAME` env var defined but hardcoded in config
- `triageQueue` exported but unused in `index.ts`

### Missing / Recommended
- `zod` — job data validation
- `prom-client` — Prometheus metrics
- `uuid` — correlation IDs
- `vitest` + `nock` — testing
- `p-retry` — retry with backoff for adapter calls

## Priority Roadmap

### High Priority
1. **Fix Redis connection error handling** — add 'error' event listener to prevent crashes
2. **Close Redis connection on shutdown** — currently only worker is closed
3. **Fix N+1 query in stale ticket scan** — replace loop with bulk update
4. **Add pagination to cron job queries** — prevent OOM with large datasets
5. **Fix silent error swallowing in dead-letter handler** — propagate errors
6. **Add job data validation** — validate `ticketId` presence in job payload
7. **Fix Docker build** — shared packages missing from build context
8. **Remove dead code** — `triageQueue` import, `coreServerUrl`, unused config

### Medium Priority
9. Make SLA thresholds configurable via env vars
10. Add stagger between cron job execution
11. Add distributed locking for cron jobs (multi-replica safety)
12. Implement `Promise.allSettled` for metrics counting
13. Fix BullMQ v5 typing (`connection as any` → proper types)
14. Add worker concurrency configuration

### Low Priority
15. Add health endpoint for K8s probes
16. Add Prometheus metrics
17. Implement distributed cron locking
18. Add admin force-retry endpoint
19. Cross-platform clean script
20. Real ESLint + Prettier setup
