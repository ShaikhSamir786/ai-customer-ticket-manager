# Repository Improvement Report — ai-ticket-shared-schema (Shared Data Models)

## Current Architecture Overview

The shared-schema is a **Sequelize model library + migration utility** consumed by microservices via `file:../ai-ticket-shared-schema`. It defines 9 models (Team, User, Ticket, TicketMessage, OverrideHistory, AuditLog, SLAPolicy, PromptTemplate, WebhookSubscription), shared enums, auto-migration logic, and seed data. It uses `sequelize-typescript` decorators.

**Current structure:**
```
src/
├── index.ts              # Barrel: model registration + exports
├── enums.ts              # TicketStatus, TicketPriority, TicketCategory, UserRole
├── config/
│   └── index.ts          # Sequelize connection factory
├── models/
│   ├── index.ts          # Barrel re-export
│   ├── Team.ts
│   ├── User.ts
│   ├── Ticket.ts
│   ├── TicketMessage.ts
│   ├── OverrideHistory.ts
│   ├── AuditLog.ts
│   ├── SLAPolicy.ts
│   ├── PromptTemplate.ts
│   └── WebhookSubscription.ts
├── migrations/
│   └── index.ts          # Auto table creation (not true migrations)
├── seeders/
│   └── index.ts          # SLA policies + prompt templates
└── docs/
```

## Folder Structure Improvements

### True Migration System
Replace the fake migration system (`model.sync({ alter: false })`) with proper versioned migrations:
```
src/
├── migrations/
│   ├── migrations.config.ts
│   ├── 001-create-teams.ts
│   ├── 002-create-users.ts
│   ├── 003-create-tickets.ts
│   ├── 004-create-ticket-messages.ts
│   ├── 005-create-override-history.ts
│   ├── 006-create-audit-logs.ts
│   ├── 007-create-sla-policies.ts
│   ├── 008-create-prompt-templates.ts
│   ├── 009-create-webhook-subscriptions.ts
│   └── runner.ts         # Sequelize migrations runner
├── models/
│   └── (existing)
```

### Separate Concerns
```
src/
├── config/
│   └── database.ts       # Sequelize connection
├── enums/
│   ├── ticket.enums.ts
│   ├── user.enums.ts
│   └── index.ts
├── models/
│   └── (existing, organized by domain)
├── migrations/
│   └── (versioned migrations)
├── seeders/
│   └── (existing plus admin user, default teams)
├── types/
│   ├── ticket.types.ts   # DTO interfaces for service layers
│   ├── user.types.ts
│   └── audit.types.ts
└── validators/
    ├── ticket.validator.ts  # Zod schemas for ticket CRUD
    └── user.validator.ts
```

## Code Quality Improvements

### Type Safety
- **Replace all `as any` casts in consuming services** by exporting proper types from here
- **Add proper typing for JSONB fields** — `AuditLog.metadata`, `PromptTemplate.metrics`, `WebhookSubscription.events` should have typed interfaces
- **Add typed enums for string columns** — `sentiment`, `customerTier`, `sourceChannel`, `assignmentMethod` in Ticket model should use TypeScript enums or union types
- **Type `Op`, `fn`, `col`, `literal` re-exports** in `src/index.ts` with proper generics

### Error Handling
- **Fix `initializeDatabase` error handling** — currently catches and logs but resolves void without letting caller know:
  ```typescript
  export async function initializeDatabase(): Promise<void> {
    await sequelize.authenticate();
    await runMigrations(sequelize);
    await runSeeders();
  }
  // Let caller handle errors
  ```
- **Add connection retry logic** — database may not be ready on first attempt
- **Add validation hooks** in models (Sequelize `beforeValidate`) for data integrity

### Validation
- Add `@Length`, `@IsEmail`, `@IsUrl` validation decorators to model fields
- Add `@IsIn` for enum-like fields (`sentiment`, `customerTier`, `sourceChannel`)
- Add check constraint validations for numeric fields (`confidence BETWEEN 0 AND 1`)
- Add unique constraints for `(name, version)` on PromptTemplate

### Logging
- Replace `console.log` for SQL queries with structured logger — pass a logger function instead of `console.log`
- Add migration execution logging (which migrations ran, duration)

## Performance Optimizations

- **Add proper indexes** — create a migration-based index strategy:
  ```typescript
  // Migration 010: Add performance indexes
  queryInterface.addIndex('tickets', ['status', 'priority', 'assignedTeamId']);
  queryInterface.addIndex('tickets', ['status', 'createdAt']);
  queryInterface.addIndex('audit_logs', ['ticketId', 'createdAt']);
  queryInterface.addIndex('ticket_messages', ['ticketId']);
  queryInterface.addIndex('override_history', ['ticketId']);
  ```
- **Normalize wide Ticket table** — consider extracting AI analysis fields into a separate `TicketAnalysis` table:
  ```typescript
  // Proposed: TicketAnalysis model
  ticketId, sentiment, churnRisk, confidence, needsHumanReview,
  suggestedReply, modelUsed, assignmentMethod, assignmentReason,
  assignmentConfidence, assignedAt
  ```
- **Add model scope defaults** — `defaultScope` for common query filters
- **Add `indexHints`** for read-heavy queries

## Security Enhancements

- **Hash or encrypt `WebhookSubscription.secret`** — secrets should not be stored in plaintext
- **Use `pg` SSL defaults** — add `dialectOptions: { ssl: { require: true, rejectUnauthorized: true } }` for production connections
- **Add row-level security** policies for multi-tenant isolation (future)
- **Add database audit triggers** as defense-in-depth alongside application-level audit
- **Remove sensitive field exports** — `DB_PASSWORD` should not be re-exported from `config/index.ts`

## Scalability Recommendations

- **Add table partitioning** for high-volume tables:
  - `audit_logs` — partition by month on `createdAt`
  - `ticket_messages` — partition by month on `createdAt`
- **Add read replica support** in Sequelize config — configure replication:
  ```typescript
  new Sequelize(null, null, null, {
    dialect: 'postgres',
    replication: {
      read: [{ host: 'replica1', ... }],
      write: { host: 'primary', ... },
    },
  });
  ```
- **Convert migrations to use native migration tools** (Umzug or Sequelize CLI) instead of custom `sync`
- **Add database migration CI** — validate migrations in CI pipeline before deployment

## DevOps & Infrastructure Improvements

- Add `package.json` `prepare` script to auto-build on local install
- Add `.gitignore` — currently missing, risk of committing `node_modules`/`dist`
- Add migration check scripts for deployment safety
- Add database seeding idempotency checks

## Testing Improvements

- **Add model unit tests** for:
  - Enum value coverage
  - Validation rules
  - Association correctness (foreign keys, belongsTo, hasMany)
- **Add migration tests** — create/drop tables in test database, verify index creation
- **Add seeder tests** — verify seed data can be inserted without duplicates
- **Use testcontainers** or in-memory SQLite for CI testing

## Developer Experience Improvements

- Add proper `npm run lint` with ESLint
- Add cross-platform `clean` script
- Document the full database setup process in README
- Add a script to generate TypeScript types from database schema introspection

## Suggested New Features

- **Soft-delete mixin** — add `deletedAt`, `deletedBy` columns to Ticket model
- **Timestamps for SLA tracking** — add `firstResponseAt`, `lastActivityAt` to Ticket
- **Tags/labels model** — support flexible ticket tagging
- **File attachment model** — support ticket attachments (reference to file storage)
- **Conversation threading** — add `parentId` to TicketMessage for reply chains
- **Default admin user seeder** — create initial admin account on setup
- **Default teams seeder** — create starter teams (Support, Billing, Engineering)

## Dependency Review

### Issues
- `dotenv` called at module scope — importing the package triggers `.env` loading as side effect from any service
- `.env` path resolution (`../../.env`) is fragile — based on `__dirname` from `dist/config/`, breaks if directory structure changes
- `reflect-metadata` globally imported — required for decorators but must be imported first in entire application

### Missing / Recommended
- `umzug` — proper migration runner (replaces custom `sync`)
- `zod` — validation schemas (shared across services)
- `pg-native` (optional) — faster PostgreSQL binding
- `dotenv-expand` — env variable expansion in `.env`

## Priority Roadmap

### High Priority
1. **Replace fake migrations with proper versioned migrations** — current `sync({ alter: false })` never applies schema changes
2. **Add database indexes** — critical for query performance at scale
3. **Remove `as any` from all model usages** — export proper types for consumers
4. **Add `(name, version)` unique constraint on PromptTemplate** — prevent duplicate versions
5. **Remove sensitive config exports** — `DB_PASSWORD` should not be re-exported
6. **Fix `initializeDatabase` error propagation** — don't silently swallow errors
7. **Add `.gitignore`** — prevent committing build artifacts

### Medium Priority
8. Add typed interfaces for JSONB fields
9. Add connection retry logic
10. Add validation decorators to model fields
11. Add database indexing migration
12. Normalize Ticket model — extract AI metadata into separate table
13. Add soft-delete mixin for Ticket
14. Add SSL configuration for production PostgreSQL

### Low Priority
15. Add table partitioning for audit_logs and ticket_messages
16. Add read replica support
17. Hash WebhookSubscription.secret at storage
18. Add default admin/team seeders
19. Full-text search setup with tsvector
20. Migration CI pipeline
