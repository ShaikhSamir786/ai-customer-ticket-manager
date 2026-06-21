# Repository Improvement Report — ai-ticket-shared-lib (Shared Library)

## Current Architecture Overview

The shared-lib is the **foundation library** consumed by every microservice via `file:../ai-ticket-shared-lib`. It provides: configuration loader (`loadConfig` + `AppConfig` interface), Winston logger factory (`createLogger`), error class hierarchy (`AppError` + 7 subclasses), and BullMQ queue constants (`QUEUE_NAMES`, `JOB_NAMES`, `EVENTS`, `DEFAULT_JOB_OPTIONS`). Additionally has `decorators/` and `types/` directories reserved for future expansion, and optional NestJS support.

**Current structure:**
```
src/
├── index.ts                       # Barrel re-export of all modules
├── config/
│   └── index.ts                   # AppConfig interface + loadConfig()
├── errors/
│   └── index.ts                   # Error class hierarchy
├── logger/
│   └── index.ts                   # Winston factory (createLogger)
├── queue/
│   └── index.ts                   # BullMQ constants
├── decorators/                    # Reserved (empty)
├── types/                         # Reserved (empty)
└── docs/
```

## ✅ Improvements Already Made

| Issue | Original Status | Current Status |
|---|---|---|
| `decorators/` directory | Did not exist | Now exists (empty — reserved) |
| `types/` directory | Did not exist | Now exists (empty — reserved) |

## Folder Structure Improvements

### Follow scheduler-server pattern
```
src/
├── index.ts
├── config/
│   └── index.ts                   # loadConfig with validation (zod)
├── constant/                      # Add shared constants (mirroring scheduler pattern)
│   └── service-constant.ts        # STATUS values, AUDIT_ACTION, common enums
├── errors/
│   └── index.ts                   # Error hierarchy + toJSON(), prototype fix
├── logger/
│   └── index.ts                   # createLogger with correlation ID support, child loggers
├── queue/
│   ├── index.ts                   # BullMQ constants (existing)
│   ├── types.ts                   # Queue types + abstraction interface
│   ├── bullmq-adapter.ts          # BullMQ implementation
│   └── kafka-adapter.ts           # Kafka implementation (future)
├── validation/
│   ├── index.ts                   # Shared zod schemas
│   └── schemas.ts                 # uuid, email, pagination, etc.
├── types/
│   ├── common.ts                  # Common types (Pagination, ApiResponse)
│   ├── request-context.ts         # Correlation ID, user context
│   └── api-response.ts            # Standard response envelope
├── decorators/
│   ├── retry.decorator.ts         # Planned
│   ├── timeout.decorator.ts       # Planned
│   └── audit-log.decorator.ts     # Planned
├── middleware/
│   ├── request-id.ts              # Express middleware for correlation IDs
│   └── async-wrap.ts              # catchAsync utility
├── docs/
```

## Code Quality Improvements

### Type Safety
- **Add runtime validation to `loadConfig()`** — use `zod` to validate required env vars (especially in production):
  ```typescript
  const configSchema = z.object({
    jwtSecret: z.string().min(32, 'JWT_SECRET must be at least 32 characters in production'),
    databaseUrl: z.string().url(),
  });
  ```
- **Fix unsafe `as 'bullmq' | 'kafka'` cast** — validate `QUEUE_TYPE` at runtime:
  ```typescript
  const validTypes = ['bullmq', 'kafka'] as const;
  type QueueType = typeof validTypes[number];
  const parsedQueueType: QueueType = validTypes.includes(queueType as QueueType) ? queueType as QueueType : 'bullmq';
  ```
- **Add `readonly` modifiers** to `AppConfig` fields
- **Export `LoggerOptions` interface** from logger module

### Error Handling
- **Fix `AppError` prototype chain** — use `Object.setPrototypeOf` to prevent broken `instanceof`:
  ```typescript
  export class AppError extends Error {
    constructor(...) {
      super(message);
      this.name = this.constructor.name;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  ```
- **Add `toJSON()` method** on `AppError` for proper serialization
- **Add correlation ID** to error instances for distributed tracing

### Validation
- Add shared Zod schemas for common patterns:
  ```typescript
  export const uuidSchema = z.string().uuid();
  export const paginationSchema = z.object({ page: z.coerce.number().int().positive(), limit: z.coerce.number().int().max(1000) });
  export const emailSchema = z.string().email();
  ```
- Fix `corsOrigins` parsing with trimming:
  ```typescript
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  ```

### Logging
- **Add correlation ID support** to logger factory (child loggers with correlation context):
  ```typescript
  const baseLogger = winston.createLogger({ ... });
  return {
    ...baseLogger,
    child: (meta: Record<string, unknown>) => baseLogger.child(meta),
    withCorrelationId: (correlationId: string) => baseLogger.child({ correlationId }),
  };
  ```
- **Add JSON-only format** for production console output (remove printf colorization in production)
- **Add `exitOnError: false`** to prevent logger crashes from taking down the process

## Performance Optimizations

- **Lazy dotenv loading** — move `dotenv.config()` out of module scope into `loadConfig()` body:
  ```typescript
  let envLoaded = false;
  export function loadConfig(): AppConfig {
    if (!envLoaded) { dotenv.config({ path: path.resolve(process.cwd(), '.env') }); envLoaded = true; }
    // ...
  }
  ```
- **Add memoization** for `loadConfig()` — call once and cache

## Security Enhancements

- **Add validation and error on missing required env vars in production** — `JWT_SECRET`, `DATABASE_URL` with no default:
  ```typescript
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }
  ```
- **Remove dev secret from defaults** — `jwtSecret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is required'); })()`
- **Add `corsOrigins` validation** — ensure at least one origin is configured in production

## Scalability Recommendations

- **Implement queue abstraction** — current constants only support BullMQ. Add interface for dual-support readiness:
  ```typescript
  interface QueueAdapter {
    add(queue: string, job: string, data: any, opts?: any): Promise<void>;
    registerWorker(queue: string, handler: (job: any) => Promise<any>): void;
  }
  ```
- **Export Kafka topic names** alongside BullMQ queue names for dual-support readiness

## DevOps & Infrastructure Improvements

- Add `prepare` script to auto-build on `npm install` (when consumed as local dependency)
- Add `.gitignore`
- Add CI build validation for the shared library

## Testing Improvements

- **Add unit tests** for:
  - `loadConfig()` — env var parsing, defaults, validation errors
  - `createLogger()` — transport configuration, child loggers
  - Error classes — status codes, `instanceof`, `toJSON()` serialization
  - Queue constants — ensure values match across BullMQ/Kafka naming

## Developer Experience Improvements

- Add proper linting with ESLint + TypeScript rules (replace `echo 'lint ok'`)
- Add cross-platform `clean` script (use `node -e "require('fs').rmSync(...)"`)
- Add JSDoc comments for all public APIs
- Add TypeScript `paths` alias for internal imports

## Suggested New Features

- **`catchAsync` utility** for Express:
  ```typescript
  export const catchAsync = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
  ```
- **`request-id` middleware** for correlation ID:
  ```typescript
  export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    req.correlationId = id;
    res.setHeader('x-request-id', id);
    next();
  }
  ```
- **Standard API response envelope type**
- **Health check utilities** — standard format for health endpoints

## Dependency Review

### Issues
- `dotenv.config()` at module scope is a side effect that can't be disabled
- `@nestjs/common` as optional peer dependency is unused — either implement NestJS decorators or remove

### Missing / Recommended
- `zod` — runtime validation for config and shared schemas
- `crypto` (built-in) — for UUID generation (`crypto.randomUUID()`)
- `vitest` — testing (dev dependency)

## Priority Roadmap

### High Priority
1. **Remove module-level `dotenv.config()` side effect** — move to lazy loading inside `loadConfig()`
2. **Add runtime validation to `loadConfig()`** — throw if required env vars missing in production
3. **Fix `AppError` prototype chain** — `Object.setPrototypeOf` to prevent broken `instanceof`
4. **Fix unsafe `as 'bullmq' | 'kafka'` cast** — add runtime validation
5. **Remove dev secrets from defaults** — don't default `JWT_SECRET` to well-known string
6. **Add `toJSON()` to `AppError`** for proper serialization across services
7. **Add correlation ID support to logger** — child loggers with correlation context

### Medium Priority
8. Add `corsOrigins` proper parsing (trim entries)
9. Add `exitOnError: false` to Winston config
10. Add JSON-only logging format in production
11. Add memoization to `loadConfig()`
12. Add shared validation schemas (zod-based)
13. Add `catchAsync` utility for Express
14. Add `request-id` middleware

### Low Priority
15. Populate or remove empty `decorators/` and `types/` directories
16. Implement NestJS decorators (or remove peer dependency)
17. Add queue abstraction (BullMQ/Kafka)
18. Add file transport configuration in logger
19. Cross-platform clean script
20. Real ESLint + Prettier
