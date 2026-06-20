# Repository Improvement Report — ai-ticket-main-server (Gateway)

## Current Architecture Overview

The main-server is a **GraphQL facade over REST microservices**. It exposes a GraphQL API (via Apollo Server 4) to frontend clients, handles authentication/authorization, rate limiting, and security headers (helmet, CORS), then proxies data operations to internal REST services (primarily `core-server`). Express serves as the HTTP layer with manual GraphQL execution (`executeHTTPGraphQLRequest`) instead of the standard `expressMiddleware`.

**Current structure:**
```
src/
├── index.ts              # Express + Apollo bootstrap
├── config.ts             # Config via shared-lib spread
├── logger.ts             # Winston via shared-lib
├── context.ts            # GraphQL context factory (JWT-based)
├── modules/
│   ├── index.ts          # SDL loader + resolver aggregation
│   ├── base.graphql      # Empty Query/Mutation stubs
│   ├── helpers.ts        # requireAuth + formatAppError
│   ├── ticket/           # Ticket SDL + query/mutation resolvers
│   └── user/             # User SDL + query/mutation resolvers
├── rest/
│   ├── middlewares/auth.ts       # JWT auth middleware (unused)
│   └── modules/
│       ├── auth/v1/services/     # Login/register proxy + JWT issue
│       └── tickets/v1/services/  # Ticket CRUD proxies to core-server
└── docs/                 # FOLDER_STRUCTURE.md + API.md
```

## Folder Structure Improvements

### Critical: Fix Mismatch Between Docs and Reality
- `src/docs/FOLDER_STRUCTURE.md` describes a `src/graphql/` directory that does not exist. Actual modules live at `src/modules/`.
- The `src/rest/routes/`, `src/boot/`, and controller-layer directories documented as "Reserved" are empty.

### Suggested Restructure
```
src/
├── index.ts
├── config.ts
├── logger.ts
├── context.ts
├── graphql/                    # Rename from modules/ to graphql/
│   ├── index.ts                # SDL loader + resolver aggregation
│   ├── base.graphql
│   ├── scalars/                # Custom scalars (DateTime, JSON)
│   ├── directives/             # Custom directives (auth, rateLimit)
│   ├── helpers.ts
│   ├── ticket/
│   │   ├── ticket.graphql
│   │   ├── resolvers/
│   │   │   ├── queries.ts
│   │   │   └── mutations.ts
│   │   └── validators.ts       # Input validation schemas
│   └── user/
│       ├── user.graphql
│       └── resolvers/...
├── rest/
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── request-id.ts       # Correlation ID middleware
│   │   └── error-handler.ts    # Express error handler
│   ├── routes/                 # Centralized route registration
│   └── modules/...
├── plugins/
│   └── apollo-plugin.ts        # Apollo plugins (logging, metrics)
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Replace all `any` types** in proxy services with proper input/output interfaces derived from GraphQL types
- Add TypeScript `strict` path aliases (`@/config`, `@/modules/ticket/...`) via `tsconfig.json` `paths`
- Fix `config.jwtExpiresIn as any` cast in auth services — define proper JWT sign options interface
- Type `req.params.provider as any` in controllers with a proper type guard

### Error Handling
- **Fix broken imports**: All 6 resolver files use incorrect relative paths (`../../../../` instead of `../../../`):
  - `src/modules/ticket/query/index.ts` line 1, 3
  - `src/modules/ticket/mutation/index.ts` line 1, 3
  - `src/modules/user/mutation/index.ts` line 1
- **All need `../../../rest/...` and `../../../context`** (not `../../../../`)
- **Wrap async Express error middleware properly** — current auth middleware throws synchronously but Express requires `next(err)` for error handler propagation
- Add `wrapAsync` helper to eliminate repeated `try/catch(next)` boilerplate in every controller

### Validation
- **Replace manual `if (!field)` checks** with a validation library (zod, joi, or graphql-constraint-directive)
- Add input validation schemas for `LoginInput`, `RegisterInput`, `CreateTicketInput`, `UpdateTicketInput`
- Validate email format, password strength, UUID format for IDs
- Add GraphQL `@constraint` directives for field-level validation

### Logging
- **Add request correlation ID middleware** (uuid or crypto.randomUUID) — propagate via `x-request-id`
- Integrate correlation ID into logger context for request-scoped logs
- Add access logging middleware (morgan or custom) for all HTTP requests

## Performance Optimizations

- **Fix build script**: `copyfiles -u 1 "src/graphql/modules/**/*.graphql" dist/` globs zero files. Change to `"src/modules/**/*.graphql"` — or better, inline SDL as TypeScript strings to eliminate runtime file dependency
- **Add DataLoader** for batch-loading entities across GraphQL resolvers (prevent N+1 queries to core-server)
- **Implement response caching** at the Apollo level (`@apollo/server` cache control) for read-heavy queries
- **Replace `fs.readFileSync` at import time** with lazy SDL loading or template literals
- **Add query complexity analysis** to prevent expensive or deeply nested queries

## Security Enhancements

- **Add `dotenv.config()` call** in `src/index.ts` — currently `dotenv` is a dependency but never invoked, meaning `.env` files are never loaded
- **Implement token blacklist/revocation** — currently JWT expiration is the only invalidation mechanism
- **Add CSRF protection** if cookie-based auth is ever introduced
- **Enforce rate limiting per-user** (not just per-IP) using JWT claim
- **Add security headers** for GraphQL endpoint (disable introspection, field suggestions in production — currently only partially done via `introspection: false`)
- **Implement proper `next(err)` pattern** in Express auth middleware — current synchronous throws will crash the process
- **Consider mTLS or API keys for inter-service communication** (currently no auth between gateway and core-server)

## Scalability Recommendations

- **Implement GraphQL federation** or schema stitching for future service growth
- **Add Redis-based session caching** for auth tokens to reduce JWT verification overhead
- **Consider Apollo Gateway** with federated subgraphs for independent service deployment
- **Implement request deduplication** for identical concurrent queries

## DevOps & Infrastructure Improvements

### Docker
- **Fix Docker build** — copy shared-lib dependency into build context before `npm install`:
  ```dockerfile
  COPY ../ai-ticket-shared-lib /shared-lib
  ```
- Add `.dockerignore` to exclude `node_modules`, `dist`, `.env`
- Add `HEALTHCHECK` instruction
- **Add graceful shutdown** — `process.on('SIGTERM', async () => { await server.stop(); process.exit(0); })`
- Use `npm ci` instead of `npm install` for deterministic builds
- Add `NODE_ENV=production` in final stage

### CI/CD
- Add lint step (`eslint`) — currently `"lint": "echo 'lint ok'"`
- Add typecheck step (`tsc --noEmit`)
- Add test step with proper test runner

## Testing Improvements

- **Add test framework** (vitest or jest) — currently zero test dependencies
- **Unit tests**: All proxy services, auth logic, context factory, helper functions
- **Integration tests**: GraphQL queries/mutations against mocked REST services
- **E2E tests**: Full gateway → core-server flow with testcontainers
- **Add Apollo integration testing** with `@apollo/server`'s test utilities

## Developer Experience Improvements

- **Fix lint script** — replace `echo 'lint ok'` with real `eslint` configuration
- Add `husky` + `lint-staged` for pre-commit checks
- Add `nodemon.json` or improve `ts-node-dev` config for faster restarts
- Add `docker-compose.override.yml` for local development
- Create proper `.env.example` with all documented vars matching actual consumption
- Add `Makefile` or npm scripts for common operations (dev, build, test, lint, docker-build)

## Suggested New Features

- **`me` query** — return authenticated user profile
- **User management queries** (`users`, `user(id)`) for admin dashboard
- **Pagination metadata** — add `totalCount`, `hasNextPage`, `pageInfo` to ticket listings
- **GraphQL subscriptions** (via WebSocket) for real-time ticket updates
- **Feature flags** — toggle service routes/features via config
- **Audit log queries** through the gateway (proxy to core-server)
- **Webhook management** endpoints

## Dependency Review

### Unused
- `PROCESSOR_SERVER_URL` and `LLM_SERVER_URL` in config — never consumed (considered dead config)

### Missing / Recommended
- `graphql-scalars` — `DateTime`, `JSON`, `UUID` custom scalars
- `@graphql-tools/*` — schema stitching, federation tools
- `dataloader` — batch loading optimization
- `zod` — input validation
- `uuid` — correlation ID generation
- `morgan` or `pino-http` — HTTP access logging

## Priority Roadmap

### High Priority
1. **Fix all 6 broken import paths** — currently the app will not compile or run
2. **Fix build script** — `.graphql` files not copied to `dist/`
3. **Add `dotenv.config()` call** — env vars not loaded at startup
4. **Fix Docker build** — shared-lib dependency missing in build context
5. **Add graceful shutdown** — SIGTERM/SIGINT handlers
6. **Fix Express auth middleware** — synchronous throws instead of `next(err)`
7. **Real lint setup** — replace stub with ESLint

### Medium Priority
8. Add correlation ID middleware and logger integration
9. Replace all `any` types with interfaces
10. Add input validation schemas
11. Implement proper pagination with metadata
12. Add DataLoader for N+1 prevention
13. Update documentation to match actual folder structure

### Low Priority
14. GraphQL federation/subscription support
15. Token blacklist/revocation
16. GraphQL query complexity analysis
17. Feature flags system
18. Performance response caching
