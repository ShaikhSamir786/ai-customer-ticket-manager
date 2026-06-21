# Repository Improvement Report — ai-ticket-main-server (Gateway)

## Current Architecture Overview

The main-server is a **GraphQL facade over REST microservices**. It exposes a GraphQL API via Apollo Server 4 (with `@as-integrations/express4` middleware) to frontend clients, handles authentication/authorization, rate limiting, and security headers (helmet, CORS), then proxies data operations to internal REST services (primarily `core-server`). Express serves as the HTTP layer.

**Current structure:**
```
src/
├── index.ts                       # Express + Apollo bootstrap (uses startApolloServer)
├── config.ts                      # Config via shared-lib spread
├── logger.ts                      # Winston via shared-lib
├── context.ts                     # GraphQL context factory (JWT-based)
├── start-apollo-server.ts         # Apollo Server setup + expressMiddleware integration
├── boot/                          # Reserved (empty)
├── modules/
│   ├── index.ts                   # SDL loader + resolver aggregation
│   ├── base.graphql               # Empty Query/Mutation stubs
│   ├── helpers.ts                 # requireAuth + formatAppError
│   ├── ticket/                    # Ticket SDL + query/mutation resolvers
│   └── user/                      # User SDL + query/mutation resolvers
├── rest/
│   ├── middlewares/
│   │   └── auth.ts                # JWT auth middleware + requireRole
│   ├── modules/
│   │   ├── auth/v1/services/      # Login/register proxy + JWT issue
│   │   └── tickets/v1/services/   # Ticket CRUD proxies to core-server
│   └── routes/                    # Reserved (empty)
└── docs/
```

## ✅ Improvements Already Made

| Issue | Original Status | Current Status |
|---|---|---|
| Broken import `./graphql/modules` | Imported non-existent path | Fixed — now `./modules` |
| Manual GraphQL execution | Used `executeHTTPGraphQLRequest` | Fixed — `@as-integrations/express4` middleware |
| Missing `expressMiddleware` | Not used | Fixed — `expressMiddleware(server, { context })` |
| No Apollo ServerPlugin | Missing | `ApolloServerPluginDrainHttpServer` added |
| Introspection config | Hardcoded | `introspection: config.nodeEnv !== 'production'` |
| No graceful shutdown | Missing | `plugin` drain handles it |
| `rest/routes/` directory | Did not exist | Now exists (empty) |
| `boot/` directory | Did not exist | Now exists (empty) |

## Folder Structure Improvements

### Consider adopting scheduler-server-style structure
The scheduler-server now has a cleaner pattern with `config/`, `constant/`, separated concerns. Consider similarly evolving:
```
src/
├── index.ts
├── config/
│   └── config.ts                   # Extract from flat config.ts
├── constant/
│   └── service-constant.ts          #consant that were used in the repo
├── logger.ts
├── context.ts
│    scalars/                    # Custom scalars (DateTime, JSON)
│    directives/                 # Custom directives (auth, rateLimit)
├── modules/                        # Rename from modules/
│   ├── index.ts                    # SDL loader + resolver aggregation
│   ├── base.graphql
│   ├── helpers.ts
│   ├── ticket/...
│   └── user/...
├── plugins/
│   └── apollo-plugin.ts            # Apollo plugins (logging, metrics)
├── rest/
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── request-id.ts
│   │   └── error-handler.ts
│   ├── routes/
│   └── modules/...
├── constant/                       # Shared constants
├── boot/                           # Bootstrap scripts
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Replace all `any` types** in proxy services with proper interfaces derived from GraphQL types
- Add TypeScript `paths` aliases via `tsconfig.json` to fix deep relative imports
- Fix `config.jwtExpiresIn as any` cast in auth services — define proper JWT sign options interface
- Define explicit types for `AuthPayload`, `LoginInput`, `RegisterInput`, `CreateTicketInput`, `UpdateTicketInput`

### Error Handling
- **Wrap async Express error middleware properly** — auth middleware throws synchronously; Express requires `next(err)` for error handler propagation
- Add `wrapAsync` helper (`catchAsync`) to eliminate repeated `try/catch(next)` boilerplate
- Add Express error handler middleware (currently absent; errors thrown from auth middleware will crash the process)

### Validation
- **Replace manual `if (!field)` checks** with a validation library (zod)
- Add GraphQL `@constraint` directives for field-level validation
- Add request validation for REST routes

### Logging
- **Add correlation ID middleware** — propagate `x-request-id` through internal service calls
- Add access logging middleware (morgan or custom)

## Performance Optimizations

- **Fix build script** — currently `copyfiles -u 1 "src/graphql/modules/**/*.graphql" dist/` globs zero files. Change to match actual path or inline SDL
- **Add DataLoader** for batch-loading entities across GraphQL resolvers
- **Implement response caching** at Apollo level for read-heavy queries
- **Replace `fs.readFileSync` at import time** with lazy SDL loading or template literals

## Security Enhancements

- **Add `dotenv.config()` call** — currently `dotenv` is a dependency but never invoked; `.env` files are never loaded
- **Implement token blacklist/revocation** — JWT expiration is the only invalidation mechanism
- **Enforce rate limiting per-user** (not just per-IP) using JWT claim
- **Consider mTLS or API keys** for inter-service communication with core-server
- **Populate `boot/`** or remove it if unused

## Scalability Recommendations

- **Implement GraphQL federation** for future service growth
- **Add Redis-based session caching** for auth tokens
- **Implement request deduplication** for identical concurrent queries

## DevOps & Infrastructure Improvements

### Docker
- **Fix Docker build** — copy shared-lib dependency into build context before `npm install`:
  ```dockerfile
  COPY ../ai-ticket-shared-lib /shared-lib
  ```
- Add `.dockerignore` to exclude `node_modules`, `dist`, `.env`
- Add `HEALTHCHECK` instruction
- Use `npm ci` instead of `npm install` for deterministic builds
- Add `NODE_ENV=production` in final stage

### CI/CD
- Add lint step (ESLint) — currently `"lint": "echo 'lint ok'"`
- Add typecheck step (`tsc --noEmit`)
- Add test step with proper test runner

## Testing Improvements

- **Add test framework** (vitest or jest) — currently zero test dependencies
- **Unit tests**: All proxy services, auth logic, context factory, helper functions
- **Integration tests**: GraphQL queries/mutations against mocked REST services
- **E2E tests**: Full gateway → core-server flow with testcontainers

## Developer Experience Improvements

- Add real ESLint + Prettier config (replace `echo 'lint ok'`)
- Add path aliases to `tsconfig.json` for cleaner imports
- Add `docker-compose.override.yml` for local development
- Create proper `.env.example` matching all consumed vars

## Suggested New Features

- **`me` query** — return authenticated user profile
- **User management queries** (`users`, `user(id)`) for admin dashboard
- **Pagination metadata** — add `totalCount`, `hasNextPage` to ticket listings
- **GraphQL subscriptions** (via WebSocket) for real-time ticket updates
- **Feature flags** — toggle service routes/features via config
- **Audit log queries** through the gateway

## Dependency Review

### Issues
- `PROCESSOR_SERVER_URL` and `LLM_SERVER_URL` in config — never consumed (dead config)
- `dotenv` in dependencies but `dotenv.config()` never called

### Missing / Recommended
- `graphql-scalars` — custom scalars (DateTime, JSON, UUID)
- `@graphql-tools/*` — schema stitching, federation
- `dataloader` — batch loading
- `zod` — input validation
- `uuid` / `crypto` — correlation ID generation

## Priority Roadmap

### High Priority
1. **Add `dotenv.config()` call** — env vars not loaded at startup
2. **Fix build script** — `.graphql` files not copied to `dist/`
3. **Fix Docker build** — shared-lib missing in build context
4. **Fix Express auth middleware** — synchronous throws instead of `next(err)`
5. **Add Express error handler middleware** — missing, crashes on thrown errors
6. **Real lint setup** — replace stub with ESLint

### Medium Priority
7. Add correlation ID middleware and logger integration
8. Replace all `any` types with interfaces
9. Add input validation schemas (zod)
10. Add DataLoader for N+1 prevention
11. Add pagination metadata to GraphQL types
12. Populate or remove empty `boot/` and `rest/routes/`

### Low Priority
13. GraphQL federation/subscription support
14. Token blacklist/revocation
15. Feature flags system
16. Performance response caching
