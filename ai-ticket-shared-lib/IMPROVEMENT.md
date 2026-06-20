# Repository Improvement Report — ai-ticket-shared-lib (Shared Library)

## Current Architecture Overview

The shared-lib is the **foundation library** consumed by every microservice via `file:../ai-ticket-shared-lib`. It provides four modules: configuration loader (`loadConfig` + `AppConfig` interface), Winston logger factory (`createLogger`), error class hierarchy (`AppError` + 7 subclasses), and BullMQ queue constants (`QUEUE_NAMES`, `JOB_NAMES`, `EVENTS`, `DEFAULT_JOB_OPTIONS`). It also has optional NestJS support (`@nestjs/common` peer dep).

**Current structure:**
```
src/
├── index.ts              # Barrel re-export of all modules
├── config/
│   └── index.ts          # AppConfig interface + loadConfig()
├── errors/
│   └── index.ts          # Error class hierarchy
├── logger/
│   └── index.ts          # Winston factory (createLogger)
├── queue/
│   └── index.ts          # BullMQ constants (DEFAULT_JOB_OPTIONS)
├── decorators/           # Empty (reserved for NestJS decorators)
├── types/                # Empty (reserved for shared types)
└── docs/
```

## Folder Structure Improvements

### Populate Reserved Directories or Remove Them
- Either add `README.md` placeholders in `decorators/` and `types/` with planned content, or remove them until implementation

### Suggested Expansion
```
src/
├── index.ts
├── config/
│   └── index.ts          # loadConfig with validation (zod)
├── errors/
│   └── index.ts          # Error hierarchy + toJSON(), correlation ID
├── logger/
│   └── index.ts          # createLogger with correlation ID support, child loggers
├── queue/
│   ├── constants.ts      # Existing constants
│   ├── types.ts          # Queue types + queue-type abstraction
│   ├── bullmq-adapter.ts # BullMQ implementation
│   └── kafka-adapter.ts  # Kafka implementation (future)
├── validation/
│   └── index.ts          # Shared zod schemas (ID, pagination, email, etc.)
├── types/
│   ├── common.ts         # Common types (Pagination, SortDirection, etc.)
│   ├── request-context.ts # Correlation ID, user context
│   └── api-response.ts   # Standard API response envelope
├── decorators/
│   ├── retry.decorator.ts
│   ├── timeout.decorator.ts
│   └── audit-log.decorator.ts
└── middleware/
    ├── request-id.ts     # Express middleware for correlation IDs
    └── async-wrap.ts     # catchAsync utility for Express
```

## Code Quality Improvements

### Type Safety
- **Add runtime validation to `loadConfig()`** — use `zod` to validate that required env vars are present:
  ```typescript
  const configSchema = z.object({
    jwtSecret: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    databaseUrl: z.string().url(),
    // ... with conditional checks for production
  });
  ```
- **Fix unsafe `as 'bullmq' | 'kafka'` cast** — validate `QUEUE_TYPE` at runtime:
  ```typescript
  const queueType = process.env.QUEUE_TYPE;
  const validTypes = ['bullmq', 'kafka'] as const;
  type QueueType = typeof validTypes[number];
  const parsedQueueType: QueueType = validTypes.includes(queueType as QueueType)
    ? (queueType as QueueType) : 'bullmq';
  ```
- **Add `readonly` modifiers** to `AppConfig` fields for immutability
- **Export `LoggerOptions` interface** from logger module to allow consumer type checking

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
- **Add `toJSON()` method** on `AppError` for proper serialization:
  ```typescript
  toJSON() {
    return { statusCode: this.statusCode, code: this.code, message: this.message, details: this.details };
  }
  ```
- **Add correlation ID** to error instances for distributed tracing
- **Add `ExternalServiceError.services`** — track which services failed in multi-service calls

### Validation
- Add shared Zod schemas for common patterns:
  ```typescript
  export const uuidSchema = z.string().uuid();
  export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(1000).default(50),
  });
  export const emailSchema = z.string().email();
  ```
- Add `corsOrigins` proper parsing with trimming:
  ```typescript
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  ```

### Logging
- **Add correlation ID support** to logger factory:
  ```typescript
  export function createLogger(options: LoggerOptions) {
    const baseLogger = winston.createLogger({ ... });
    return {
      ...baseLogger,
      child: (meta: Record<string, unknown>) => baseLogger.child(meta),
      withCorrelationId: (correlationId: string) => baseLogger.child({ correlationId }),
    };
  }
  ```
- **Add file transport** option (configurable) for persistent logs
- **Add JSON-only format** for production console output (remove `printf` colorization when `NODE_ENV=production`)
- **Add `exitOnError: false`** to prevent logger crashes from taking down the process

## Performance Optimizations

- **Lazy dotenv loading** — move `dotenv.config()` out of module scope into `loadConfig()`:
  ```typescript
  export function loadConfig(): AppConfig {
    if (!envLoaded) { dotenv.config({ path: path.resolve(process.cwd(), '.env') }); envLoaded = true; }
    // ...
  }
  ```
  This prevents side effects on import and allows configuration of dotenv path
- **Add memoization** for `loadConfig()` — call once and cache, rather than recomputing on every invocation
- **Consider `config` as a singleton** to avoid repeated env var parsing

## Security Enhancements

- **Add validation and error on missing required env vars in production** — `JWT_SECRET`, `DATABASE_URL` with no default:
  ```typescript
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
  }
  ```
- **Add `corsOrigins` validation** — ensure at least one origin is configured in production
- **Add rate limit defaults** to shared config
- **Remove dev secret from defaults** — `jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production'` is a security risk. Better to throw if missing and let the consumer handle defaults:
  ```typescript
  jwtSecret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is required'); })(),
  ```

## Scalability Recommendations

- **Implement queue abstraction** — current constants only support BullMQ. Add interface:
  ```typescript
  interface QueueAdapter {
    add(queueName: string, jobName: string, data: any, opts?: any): Promise<void>;
    registerWorker(queueName: string, handler: (job: any) => Promise<any>): void;
  }
  ```
- **Export Kafka topic names** alongside BullMQ queue names for dual-support readiness
- **Add distributed tracing types** — OpenTelemetry span context types for future instrumentation

## DevOps & Infrastructure Improvements

- Add `prepare` script to auto-build on `npm install` (when consumed as local dependency)
- Add `.gitignore`
- Add CI build validation for the shared library
- Add API documentation generation from TypeScript types

## Testing Improvements

- **Add unit tests** for:
  - `loadConfig()` — env var parsing, defaults, validation
  - `createLogger()` — transport configuration, child loggers
  - Error classes — status codes, code strings, `toJSON()` serialization
  - Queue constants — ensure values match across BullMQ/Kafka naming
- **Test with mocked process.env** — restore after each test case
- **Test error prototype chain** — verify `instanceof` works correctly

## Developer Experience Improvements

- Add proper linting with ESLint + TypeScript rules
- Add cross-platform `clean` script
- Add JSDoc comments for all public APIs
- Add TypeScript `paths` alias for internal imports within the library
- Add a simple test runner script

## Suggested New Features

- **`async-wrap.ts`** utility for Express:
  ```typescript
  export const catchAsync = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
  ```
- **`request-id.ts`** Express middleware for correlation ID:
  ```typescript
  export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    req.correlationId = id;
    res.setHeader('x-request-id', id);
    next();
  }
  ```
- **Standard API response envelope type**
- **Health check utilities** — standard health check response format
- **Pagination helper** — shared pagination logic

## Dependency Review

### Issues
- `dotenv.config()` at module scope is a side effect that can't be disabled or configured
- `@nestjs/common` as optional peer dependency is unused — either implement NestJS decorators or remove

### Missing / Recommended
- `zod` — runtime validation for config and shared schemas
- `crypto` (built-in) — for UUID generation (use `crypto.randomUUID()`)
- `vitest` — testing (dev dependency)

## Priority Roadmap

### High Priority
1. **Remove module-level `dotenv.config()` side effect** — move to lazy loading inside `loadConfig()`
2. **Add runtime validation to `loadConfig()`** — throw if required env vars are missing in production
3. **Fix `AppError` prototype chain** — `Object.setPrototypeOf` to prevent broken `instanceof`
4. **Fix unsafe `as 'bullmq' | 'kafka'` cast** — add runtime validation
5. **Remove dev secrets from defaults** — don't default `JWT_SECRET` to a well-known string
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
18. File transport configuration in logger
19. Cross-platform clean script
20. Real ESLint + Prettier
