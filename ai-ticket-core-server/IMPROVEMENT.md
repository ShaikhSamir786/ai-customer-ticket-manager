# Repository Improvement Report — ai-ticket-core-server (Core Service)

## Current Architecture Overview

The core-server is a **RESTful Express API** that serves as the data authority for tickets, teams, and audit logs. It uses Sequelize with PostgreSQL (models from `@ai-ticket/shared-schema`) and enqueues triage jobs to BullMQ on ticket creation. It has no authentication middleware (internal service only).

**Current structure:**
```
src/
├── index.ts              # Express bootstrap
├── config.ts             # Config via shared-lib spread
├── logger.ts             # Winston via shared-lib
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts
│   └── modules/
│       ├── tickets/v1/  # Routes, controllers, services (CRUD + triage update)
│       ├── teams/v1/    # Routes, controllers, services (CRUD)
│       └── audit/v1/    # Routes, controllers, services (read-only)
└── docs/
    ├── boot/             # Empty (reserved)
    ├── constants/        # Empty
    ├── enums/            # Empty
    ├── functions/        # Empty
    ├── types/            # Empty
    └── rest/routes/      # Empty
```

## Folder Structure Improvements

### Eliminate Empty Reserved Directories
- Remove or populate `boot/`, `constants/`, `enums/`, `functions/`, `types/`, `rest/routes/`
- If they are planned, add `README.md` placeholders explaining their purpose

### Suggested Restructure
```
src/
├── index.ts
├── config.ts
├── logger.ts
├── redis-client.ts          # Extract Redis connection from service file
├── middleware/
│   ├── error-handler.ts
│   ├── async-wrap.ts        # catchAsync helper
│   ├── request-id.ts        # Correlation ID middleware
│   └── internal-auth.ts     # API key / mTLS validation
├── modules/
│   ├── tickets/
│   │   ├── ticket.routes.ts
│   │   ├── ticket.controller.ts
│   │   ├── ticket.service.ts
│   │   ├── ticket.validator.ts    # Request validation schemas
│   │   └── ticket.queue.ts        # Queue logic extracted
│   ├── teams/...
│   └── audit/...
├── shared/
│   ├── pagination.ts         # Reusable pagination utilities
│   ├── validation.ts         # Shared validation helpers
│   └── constants.ts          # App-specific constants
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Remove all `as any` casts** in services — 8 occurrences across ticket, team, and dead-letter services
- **Replace `data: any`, `query: any`, `Record<string, any>`** with proper interfaces
- Define explicit types for:
  ```typescript
  interface CreateTicketDto { customerId: string; subject: string; message: string; ... }
  interface TicketQuery { status?: string; priority?: string; page?: number; limit?: number; ... }
  interface TriageResult { category: string; priority: string; confidence: number; ... }
  ```
- **Fix deep relative imports** like `../../../../../logger` — use path aliases or extract to a shared `src/lib/` barrel

### Error Handling
- **Add Sequelize transactions** for all paired operations:
  - `updateTicket` + `AuditLog.create` (at risk of inconsistent state)
  - `updateTicketTriage` + `AuditLog.create`
  - `deadLetterHandler` `Ticket.update` + `AuditLog.create`
- **Wrap `AuditLog.create` metadata** with typed interfaces instead of `as any`
- **Log known `AppError` instances** — currently only unknown errors are logged, masking operational issues
- **Add proper pagination bounds validation** — `parseInt('abc')` returns `NaN` silently

### Validation
- Add request validation middleware using `zod` or `express-validator`:
  ```typescript
  const createTicketSchema = z.object({
    customerId: z.string().uuid(),
    subject: z.string().min(1).max(200),
    message: z.string().min(1),
  });
  ```
- Validate enum values (`status`, `priority`, `category`) at the API boundary
- Validate UUID format for all ID parameters
- Validate email format for user-related fields
- Add range validation for `confidence` (0-1), pagination params

### Logging
- **Add correlation ID middleware** — propagate `x-request-id` across internal service calls
- Move from `console.log` to structured `logger.info` for SQL query logging
- Log audit-worthy events (create, update, triage) with before/after snapshot

## Performance Optimizations

### Database
- **Add indexes** on frequently queried columns:
  - `tickets.status`, `tickets.priority`, `tickets.assignedTeamId`
  - `tickets.createdAt` for SLA queries
  - `audit_logs.ticketId`, `audit_logs.createdAt`
  - `ticket_messages.ticketId`
  - `override_history.ticketId`
- **Add composite indexes** for common query patterns:
  - `(status, priority, assignedTeamId)` for filtered listings
  - `(status, createdAt)` for SLA breach scans
- **Fix `getTickets` count+findAll pattern** — use Sequelize `findAndCountAll` to avoid race conditions
- **Add pagination max limit** — cap at 1000 to prevent OOM
- **Add `subQuery: false` by default** for complex joins to avoid Sequelize subquery breakage

### Redis/Queue
- **Extract Redis connection** from `getQueue()` into a shared `redis-client.ts`
- **Read Redis config from env** — currently hardcoded `{ host: 'localhost', port: 6379 }` ignores `REDIS_URL`
- **Add queue connection retry logic** with exponential backoff
- **Handle queue enqueue failure gracefully** — current `logger.warn` silently skips, tickets without triage jobs

## Security Enhancements

- **Implement internal auth** between services:
  - Shared API key via `x-api-key` header
  - Or mTLS for zero-trust networking
- **Remove password hash exposure** — `GET /v1/auth/verify` returns `passwordHash` to the gateway. Move password verification to core-server:
  ```typescript
  POST /v1/auth/login { email, password } → { token, user }
  ```
- **Add input sanitization** for all string fields (prevent XSS in stored data)
- **Rate limit at the internal level** as defense-in-depth
- **Validate HTTP method** — reject unsupported methods with 405

## Scalability Recommendations

- **Implement queue-type switching** — `QUEUE_TYPE` env var is defined in `.env.sample` but never read (hardcoded BullMQ)
- **Abstract queue operations** behind an interface:
  ```typescript
  interface TicketQueue {
    enqueue(ticketId: string): Promise<void>;
  }
  class BullMQTicketQueue implements TicketQueue { ... }
  class KafkaTicketQueue implements TicketQueue { ... }
  ```
- **Add read replicas** for query-heavy operations — configure Sequelize replication
- **Implement CQRS** for ticket listing vs ticket mutation
- **Add database connection pooling** — already configured but verify pool size against workload

## DevOps & Infrastructure Improvements

### Docker
- **Fix Docker build** — copy both `ai-ticket-shared-schema` and `ai-ticket-shared-lib` into build context
- Add `.dockerignore`
- Add `HEALTHCHECK` — `curl -f http://localhost:3001/health`
- **Run as non-root user** — security best practice
- Use `npm ci --only=production` for final stage

### Monitoring
- Add Prometheus metrics endpoint (`/metrics`) with:
  - Request count, duration, error rate per route
  - Queue depth of `ticket-triage`
  - Database connection pool utilization
- Add structured health check with dependency status:
  ```json
  { "status": "ok", "dependencies": { "postgres": "ok", "redis": "ok" } }
  ```

## Testing Improvements

- **Add test framework** (vitest suggested) — currently zero test dependencies
- **Unit tests**: All service functions with mocked Sequelize models
- **Integration tests**: Route handlers with supertest, test database
- **Factory pattern** for test fixtures using `@sitebender/factories` or similar
- Test critical paths:
  - Ticket creation → queue enqueue
  - Ticket update → audit log creation
  - Triage update → status change
  - Pagination boundary cases

## Developer Experience Improvements

- Fix `clean` script for cross-platform — use `rimraf` or `shx`
- Add real ESLint + Prettier config
- Add `nodemon.json` for development
- Add `docker-compose.core.yml` for local service dependencies (postgres, redis)
- Add `Makefile` with common commands
- Document the `.env` setup process clearly

## Suggested New Features

- **DELETE endpoints** for teams (soft delete using `isActive`)
- **Bulk operations**: batch ticket status update, batch assign
- **Export endpoints**: CSV/JSON export of tickets, audit logs
- **Webhook delivery** — trigger webhooks on ticket.created, ticket.updated events
- **SLA calculation engine** — compute SLA status per ticket
- **Soft delete** for tickets instead of hard delete
- **Full-text search** on ticket subject/message using PostgreSQL `tsvector`

## Dependency Review

### Missing / Recommended
- `zod` or `joi` — input validation
- `morgan` or `pino-http` — HTTP access logging
- `uuid` — correlation ID generation
- `prom-client` — Prometheus metrics
- `rimraf` — cross-platform clean
- `vitest` + `supertest` — testing

### Concerns
- `dotenv` listed but never directly imported — used via shared-lib's `loadConfig()`
- `sequelize` and `pg` are transitive dependencies from shared-schema — should be pinned in package.json if services build independently

## Priority Roadmap

### High Priority
1. **Remove password hash exposure** — move password verification to core-server
2. **Fix hardcoded Redis connection** — read from env/`REDIS_URL`
3. **Add Sequelize transactions** for paired update+audit operations
4. **Add internal auth** between gateway and core-server
5. **Fix Docker build** — include shared packages in build context
6. **Remove all `as any` casts** — 8+ occurrences
7. **Add database indexes** for query performance

### Medium Priority
8. Add request validation middleware
9. Add correlation ID middleware
10. Abstract queue implementation behind interface
11. Add pagination max limit and bounds validation
12. Fix deep relative imports with path aliases
13. Add Prometheus metrics endpoint
14. Implement queue-type switching for Kafka readiness

### Low Priority
15. Populate or remove empty reserved directories
16. Add full-text search
17. Implement webhook delivery
18. Add subscription queries audit endpoints
19. Cross-platform `clean` script
20. Real ESLint + Prettier setup
