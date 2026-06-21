# Repository Improvement Report — ai-ticket-core-server (Core Service)

## Current Architecture Overview

The core-server is a **RESTful Express API** that serves as the data authority for tickets, teams, employees, and audit logs. It uses Sequelize with PostgreSQL (models from `@ai-ticket/shared-schema`) and enqueues triage jobs to BullMQ on ticket creation. It has no authentication middleware (internal service only). A `bootstrap()` pattern initializes the database (authenticate + migrate + seed default employees) before the server starts listening.

**Current structure:**
```
src/
├── index.ts                       # Express bootstrap + bootstrap() call
├── config.ts                      # Config via shared-lib spread
├── logger.ts                      # Winston via shared-lib
├── boot/
│   ├── index.ts                   # Bootstrap: authenticate + migrate + seed
│   └── seed-default-employees.ts  # 8 realistic support agents + 1 manager
├── constants/                     # Reserved (empty)
├── enums/                         # Reserved (empty)
├── functions/                     # Reserved (empty)
├── types/                         # Reserved (empty)
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts       # Global error handler
│   ├── modules/
│   │   ├── tickets/v1/            # Routes, controllers, services
│   │   ├── teams/v1/              # Routes, controllers, services
│   │   └── audit/v1/              # Routes, controllers, services
│   └── routes/                    # Reserved (empty)
└── docs/
```

## ✅ Improvements Already Made

| Issue | Original Status | Current Status |
|---|---|---|
| No bootstrap/initialization | Server started immediately | `bootstrap()` runs auth + migrate + seed before listen |
| No seed data for employees | Missing | `seed-default-employees.ts` creates 9 realistic agents |
| No `boot/` directory | Did not exist | Populated with `index.ts` + seeder |
| `rest/routes/` directory | Did not exist | Now exists (empty) |
| `constants/`, `enums/`, etc. | Did not exist | Now exist (empty — reserved) |
| Error handling at startup | Uncaught | `.catch()` logs error and `process.exit(1)` |

## Folder Structure Improvements

### Follow scheduler-server pattern
Adopt the proven structure:
```
src/
├── index.ts
├── config/
│   ├── config.ts                  # Flat config → directory with overrides
│   ├── database.ts                # DB-specific config
│   └── redis.ts                   # Redis-specific config
├── logger.ts
├── boot/
│   ├── index.ts
│   └── seed-default-employees.ts
├── constant/
│   ├── service-constant.ts        # STATUS, AUDIT_ACTION, AUDIT_ENTITY
│   └── sla.constant.ts
├── middleware/
│   ├── error-handler.ts
│   ├── async-wrap.ts              # catchAsync helper
│   ├── request-id.ts              # Correlation ID middleware
│   └── internal-auth.ts           # API key validation
├── modules/
│   ├── tickets/
│   │   ├── ticket.routes.ts
│   │   ├── ticket.controller.ts
│   │   ├── ticket.service.ts
│   │   ├── ticket.validator.ts
│   │   └── ticket.queue.ts
│   ├── teams/...
│   └── audit/...
├── shared/
│   ├── pagination.ts
│   ├── validation.ts
│   └── constants.ts
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Remove all `as any` casts** — 8+ occurrences across ticket, team, and dead-letter services
- **Replace `data: any`, `query: any`, `Record<string, any>`** with proper DTO interfaces
- **Fix deep relative imports** — use path aliases or extract to `src/shared/`
- Use `satisfies` keyword (like scheduler now does) for typed metadata instead of `as any`

### Error Handling
- **Add Sequelize transactions** for paired `update + AuditLog.create` operations
- **Log known `AppError` instances** — currently only unknown errors are logged
- **Add proper pagination bounds validation** — `parseInt('abc')` returns `NaN` silently
- **Add catchAsync wrapper** to eliminate `try/catch(next)` boilerplate in all controllers

### Validation
- Add request validation middleware using `zod`:
  ```typescript
  const createTicketSchema = z.object({
    customerId: z.string(),
    subject: z.string().min(1).max(200),
    message: z.string().min(1),
  });
  ```
- Validate enum values, UUID format, email format at the API boundary

### Logging
- **Add correlation ID middleware** — propagate `x-request-id` across internal service calls
- Replace `console.log` in seeders with structured `logger.info`

## Performance Optimizations

### Database
- **Add indexes** on frequently queried columns:
  - `tickets.status`, `tickets.priority`, `tickets.assignedTeamId`
  - `tickets.createdAt`, `audit_logs.ticketId`, `ticket_messages.ticketId`
  - Composite: `(status, priority, assignedTeamId)`, `(status, createdAt)`
- **Fix `getTickets` count+findAll** — use `findAndCountAll` to avoid race conditions
- **Add pagination max limit** — cap at 1000 to prevent OOM

### Redis/Queue
- **Extract Redis connection** from `getQueue()` into a shared `redis-client.ts`
- **Read Redis config from env** — currently hardcoded `{ host: 'localhost', port: 6379 }` ignores `REDIS_URL`
- **Add queue connection retry logic** with exponential backoff

## Security Enhancements

- **Implement internal auth** between services — shared API key via `x-api-key` header or mTLS
- **Remove password hash exposure** — `GET /v1/auth/verify` returns `passwordHash`. Move password verification to core-server:
  ```typescript
  POST /v1/auth/login { email, password } → { token, user }
  ```
- **Add input sanitization** for all string fields (prevent XSS in stored data)
- **Populate or remove empty directories** — `constants/`, `enums/`, `functions/`, `types/`

## Scalability Recommendations

- **Implement queue-type switching** — `QUEUE_TYPE` env var defined but never consumed
- **Abstract queue operations** behind interface for Kafka readiness
- **Add read replicas** — configure Sequelize replication for query-heavy operations
- **Implement CQRS** for ticket listing vs ticket mutation

## DevOps & Infrastructure Improvements

### Docker
- **Fix Docker build** — copy `ai-ticket-shared-schema` and `ai-ticket-shared-lib` into build context
- Add `.dockerignore` (follow scheduler pattern — already has one)
- Add `HEALTHCHECK` — `curl -f http://localhost:3001/health`
- **Run as non-root user** — security best practice

### Monitoring
- Add Prometheus metrics endpoint (`/metrics`) with request count, duration, queue depth
- Add structured health check with dependency status (PostgreSQL, Redis)

## Testing Improvements

- **Add test framework** (vitest) — currently zero test dependencies
- **Unit tests**: All service functions with mocked Sequelize models
- **Integration tests**: Route handlers with supertest + test database
- **Test critical paths**: ticket creation → queue enqueue, ticket update → audit log, triage update → status change

## Developer Experience Improvements

- Fix `clean` script for cross-platform — use `node -e "require('fs').rmSync(...)"` (like scheduler)
- Add real ESLint + Prettier config
- Add `docker-compose.core.yml` for local dependencies (postgres, redis)

## Dependency Review

### Missing / Recommended
- `zod` — input validation
- `prom-client` — Prometheus metrics
- `uuid` — correlation ID generation
- `rimraf` / node built-in — cross-platform clean
- `vitest` + `supertest` — testing
- `morgan` — HTTP access logging

### Issues
- `dotenv` listed but never directly imported (used via shared-lib's `loadConfig()`)
- `sequelize` and `pg` are transitive deps from shared-schema

## Priority Roadmap

### High Priority
1. **Remove password hash exposure** — move password verification to core-server
2. **Fix hardcoded Redis connection** — read from env / `REDIS_URL`
3. **Add Sequelize transactions** for paired update+audit operations
4. **Add internal auth** between gateway and core-server
5. **Fix Docker build** — include shared packages in build context
6. **Remove all `as any` casts** — 8+ occurrences
7. **Add database indexes** for query performance

### Medium Priority
8. Add request validation middleware (zod)
9. Add correlation ID middleware
10. Abstract queue implementation behind interface
11. Add pagination max limit and bounds validation
12. Fix deep relative imports with path aliases
13. Add Prometheus metrics endpoint
14. Populate or remove empty reserved directories

### Low Priority
15. Cross-platform `clean` script
16. Real ESLint + Prettier setup
17. Add full-text search
18. Implement webhook delivery
