# Repository Improvement Report — ai-ticket-shared-schema (Shared Data Models)

## Current Architecture Overview

The shared-schema is a **Sequelize model library + true migration system** consumed by microservices via `file:../ai-ticket-shared-schema`. It defines 10 models (Team, User, Ticket, TicketMessage, OverrideHistory, AuditLog, SLAPolicy, PromptTemplate, WebhookSubscription, Employee), shared enums, proper versioned migrations (11 migration files), seed data, and a `sequelize-client.ts` entry point. It uses `sequelize-typescript` decorators.

**Current structure:**
```
src/
├── index.ts                       # Barrel: model registration + exports
├── sequalize-client.ts            # Dedicated Sequelize client with model registration
├── enums.ts                       # TicketStatus, TicketPriority, TicketCategory, UserRole, Department
├── config/
│   └── index.ts                   # Sequelize connection factory
├── models/
│   └── index.ts                   # Barrel re-export → schema/main-server/models
├── schema/
│   └── main-server/
│       ├── models/
│       │   ├── index.ts           # All model re-exports
│       │   ├── Team.ts
│       │   ├── User.ts
│       │   ├── Ticket.ts
│       │   ├── TicketMessage.ts
│       │   ├── OverrideHistory.ts
│       │   ├── AuditLog.ts
│       │   ├── SLAPolicy.ts
│       │   ├── PromptTemplate.ts
│       │   ├── WebhookSubscription.ts
│       │   └── Employee.ts        # NEW model
│       └── migrations/
│           ├── 20240101...-create-teams.ts         # Up to 11 versioned migrations
│           ├── 20240101...-create-employees.ts
│           └── 20240101...-fix-employees-id-default.ts
├── migrations/
│   └── index.ts                   # Migration runner (reads from schema/main-server/migrations/)
├── seeders/
│   └── index.ts                   # SLA policies + prompt templates
└── docs/
```

## ✅ Improvements Already Made

| Issue | Original Status | Current Status |
|---|---|---|
| Fake migration system (`sync`) | `model.sync({ alter: false })` never applied schema changes | **Proper versioned migrations** — 11 migration files with `up`/`down`, `SequelizeMeta` tracking table |
| No `down`/rollback support | Missing | `undoLastMigration()` function + scripts |
| No `Employee` model | Missing | **New model** with `@PrimaryKey`, `@Default(DataType.UUIDV4)`, skills JSONB, department enum, team/user relationships |
| Model re-exports structure | Flat `models/` directory | **`schema/main-server/models/`** — domain-namespace ready for multi-service schemas |
| `sequelize-client.ts` | Did not exist | **Separated** from barrel index for cleaner imports |
| `Department` enum | Missing | Added to `enums.ts` |
| Migration scripts | Missing | `db:migrate` and `migrate:undo` npm scripts added |
| `ts-node` devDependency | Missing | Added for migration execution |
| `Employee` model re-export | Missing | Exported via `models/index.ts` → `schema/main-server/models/index.ts` |

## Folder Structure Improvements

### Follow scheduler-server clean pattern
```
src/
├── index.ts
├── sequalize-client.ts
├── config/
│   └── database.ts                # Sequelize connection
├── enums/
│   ├── index.ts                   # All enums re-exported
│   ├── ticket.enums.ts            # TicketStatus, TicketPriority, TicketCategory
│   ├── user.enums.ts              # UserRole
│   └── department.enum.ts         # Department
├── schema/
│   └── main-server/
│       ├── models/...
│       └── migrations/...
├── constant/                      # Shared constants between models
│   └── model-constants.ts         # Default values, field lengths
├── migrations/
│   └── index.ts                   # Migration runner (existing)
├── seeders/
│   └── index.ts                   # Existing — good
├── types/                         # DTOs for service layers
│   ├── ticket.types.ts
│   ├── employee.types.ts
│   └── audit.types.ts
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Add proper typing for JSONB fields** — `AuditLog.metadata`, `Employee.skills`, `PromptTemplate.metrics` should have typed interfaces exported for consumers
- **Add typed enums for string columns** — `sentiment`, `customerTier`, `sourceChannel`, `assignmentMethod` in Ticket model should use union types or enums
- **Type `Op`, `fn`, `col`, `literal` re-exports** with proper generics

### Error Handling
- **Fix `initializeDatabase` error handling** — currently catches and logs but resolves void without letting caller know:
  ```typescript
  export async function initializeDatabase(): Promise<void> {
    await sequelize.authenticate();
    await runMigrations(sequelize);
    await runSeeders();
  } // Let caller handle errors
  ```
- **Add connection retry logic** — database may not be ready on first attempt

### Validation
- Add `@Length`, `@IsEmail`, `@IsUrl` validation decorators to model fields
- Add `@IsIn` for enum-like fields (`sentiment`, `customerTier`, `sourceChannel`)
- Add unique constraint for `(name, version)` on PromptTemplate

### Logging
- Replace `console.log` in migration runner with structured logger
- Add migration execution logging (which migrations ran, duration)

## Performance Optimizations

- **Add proper indexes via migration**:
  ```typescript
  // New migration: Add performance indexes
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status_created ON tickets (status, created_at)`;
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ticket ON audit_logs (ticket_id, created_at)`;
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages (ticket_id)`;
  ```
- **Normalize wide Ticket table** — extract AI analysis fields into separate `TicketAnalysis` table (34+ AI-related columns in Ticket)
- **Add `indexHints`** for read-heavy queries

## Security Enhancements

- **Hash or encrypt `WebhookSubscription.secret`** — secrets should not be stored in plaintext
- **Use `pg` SSL defaults** — add `dialectOptions: { ssl: { require: true } }` for production connections
- **Remove sensitive field exports** — `DB_PASSWORD` should not be re-exported from `config/index.ts`
- **Add row-level security** policies for multi-tenant isolation (future)

## Scalability Recommendations

- **Add table partitioning** for high-volume tables:
  - `audit_logs` — partition by month on `createdAt`
  - `ticket_messages` — partition by month on `createdAt`
- **Add read replica support** in Sequelize config — configure `replication` block
- **Add database migration CI** — validate migrations in CI before deployment

## DevOps & Infrastructure Improvements

- Add `package.json` `prepare` script to auto-build on local install
- Add `.gitignore` (still missing across many repos)
- Add migration check scripts for deployment safety

## Testing Improvements

- **Add model unit tests** for: enum value coverage, validation rules, association correctness
- **Add migration tests** — create/drop tables in test database, verify index creation
- **Add seeder tests** — verify seed data can be inserted without duplicates

## Developer Experience Improvements

- Add `npm run lint` with real ESLint
- Fix Windows-specific `clean` script (`if exist dist rmdir`) — use cross-platform `node -e "fs.rmSync(...)"`
- Add a script to generate TypeScript types from database schema introspection

## Suggested New Features

- **Soft-delete mixin** — add `deletedAt`, `deletedBy` columns to Ticket model
- **Timestamps for SLA tracking** — add `firstResponseAt`, `lastActivityAt` to Ticket
- **Tags/labels model** — support flexible ticket tagging
- **File attachment model** — support ticket attachments
- **Conversation threading** — add `parentId` to TicketMessage for reply chains
- **Default admin user seeder** — create initial admin account on setup
- **Default teams seeder** — create starter teams (Support, Billing, Engineering)

## Dependency Review

### Issues
- `dotenv` called at module scope — importing the package triggers `.env` loading as side effect from any service
- `.env` path resolution (`../../.env`) is fragile — based on `__dirname` from `dist/config/`

### Missing / Recommended
- `umzug` — standard migration runner (replace custom runner)
- `zod` — validation schemas for shared DTOs
- `pg-native` (optional) — faster PostgreSQL binding

## Priority Roadmap

### High Priority
1. **Remove `dotenv` module-level side effect** — move to lazy loading in `loadConfig()`
2. **Add typed interfaces for all JSONB fields** — employees, audit logs, templates
3. **Add database indexes via migration** — critical for production performance
4. **Add unique constraint on `(name, version)` for PromptTemplate** — prevent duplicate versions
5. **Remove sensitive config exports** — `DB_PASSWORD` should not be re-exported
6. **Fix `initializeDatabase` error propagation** — don't silently swallow errors
7. **Fix cross-platform `clean` script**

### Medium Priority
8. Add connection retry logic
9. Add validation decorators to model fields
10. Normalize Ticket model — extract AI metadata
11. Add Soft-delete mixin for Ticket
12. Add SSL configuration for production PostgreSQL

### Low Priority
13. Add table partitioning for audit_logs and ticket_messages
14. Add read replica support
15. Hash WebhookSubscription.secret at storage
16. Add default admin/team seeders
17. Migration CI pipeline
18. Full-text search setup with tsvector
