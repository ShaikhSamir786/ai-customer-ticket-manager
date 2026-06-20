# Repository Improvement Report — ai-ticket-llm-server (LLM Provider Abstraction)

## Current Architecture Overview

The llm-server is a **REST API for LLM provider abstraction**. It exposes `POST /v1/analyze` (default fallback chain) and `POST /v1/analyze/:provider` (specific provider), plus `GET/POST /v1/prompts` (prompt template CRUD). It uses a `Provider` abstraction with `LLMRouter` implementing Chain-of-Responsibility (OpenAI → Anthropic → Ollama) with automatic provider registration based on API keys.

**Current structure:**
```
src/
├── index.ts              # Express bootstrap
├── config.ts             # Config via shared-lib spread
├── logger.ts             # Winston via shared-lib
├── providers/
│   ├── types.ts          # LLMProvider interface + types
│   ├── router.ts         # LLMRouter fallback chain
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   └── ollama-provider.ts
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts
│   └── modules/
│       ├── analyze/v1/   # Routes, controllers, services
│       └── prompts/v1/   # Routes, controllers, services
└── docs/
```

## Folder Structure Improvements

### Extract Shared Provider Infrastructure
```
src/
├── providers/
│   ├── types.ts               # LLMProvider interface + shared types
│   ├── router.ts              # LLMRouter (existing)
│   ├── base-provider.ts       # Abstract base with common logic (retry, timing, token counting)
│   ├── openai-provider.ts     # (existing, extend from base)
│   ├── anthropic-provider.ts  # (existing, extend from base)
│   ├── ollama-provider.ts     # (existing, extend from base)
│   └── provider-registry.ts   # Separated from router constructor
├── rest/
│   └── modules/
│       ├── analyze/
│       │   └── v1/
│       │       ├── routes.ts
│       │       ├── controllers/
│       │       ├── services/
│       │       └── validators.ts   # Zod schemas for analyze request
│       └── prompts/
│           └── v1/
│               ├── routes.ts
│               ├── controllers/
│               ├── services/
│               ├── validators.ts   # Zod schemas
│               └── migrations/     # If needed
```

## Code Quality Improvements

### Type Safety
- **Remove `as any` casts** — especially `req.params.provider as any` in analyze controller. Add a type guard:
  ```typescript
  const PROVIDER_TYPES = ['openai', 'anthropic', 'ollama'] as const;
  type ProviderType = typeof PROVIDER_TYPES[number];
  function isProviderType(val: string): val is ProviderType {
    return PROVIDER_TYPES.includes(val as ProviderType);
  }
  ```
- **Replace `Record<string, any>`** for `options` in `LLMProvider.analyze()` with a typed interface:
  ```typescript
  interface AnalyzeOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
  ```
- **Fix return type duplication** in router — use `LLMResponse & { provider: string }` instead of inline type

### Error Handling
- **Preserve error details in "All providers failed"** — include which providers failed and why:
  ```typescript
  const errors: Array<{ provider: string; error: string }> = [];
  // ... catch per provider
  throw new ExternalServiceError('llm', `All providers failed: ${JSON.stringify(errors)}`);
  ```
- **Add provider-specific error handling** for rate limits (429), context length exceeded, auth failures
- **Handle empty/partial responses** — validate `response.choices[0]` exists before accessing properties
- **Fix `choice?.message?.content` fallback** — distinguish between empty response and error (currently both map to `''`)

### Validation
- Add Zod schemas for analyze request/response:
  ```typescript
  const analyzeSchema = z.object({
    prompt: z.string().min(1).max(32000),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(128000).optional(),
    jsonMode: z.boolean().optional(),
  });
  ```
- Add prompt template validation (validate variables match template placeholders)
- Validate `provider` parameter against available providers

### Logging
- Log token usage per provider request (already partially done)
- Log model selection for each request
- Add correlation ID to all log entries
- Log LLM response latency with percentile tracking

## Performance Optimizations

- **Add HTTP keep-alive** for provider SDKs — OpenAI and Anthropic SDKs may create new connections per request
- **Add response caching** for identical prompts (LRU cache with TTL)
- **Add timeout configuration** per provider — each provider SDK call should have a timeout
- **Add concurrent request limiting** per provider to avoid rate limit spikes
- **Stream readiness** — keep the sync interface but lay groundwork for SSE streaming

## Security Enhancements

- **Sanitize prompts before sending to LLM providers** — strip potentially sensitive data based on content type
- **Add prompt length limits** — enforce max tokens before sending to avoid cost spikes
- **Mask API keys in logs** — ensure `config.llm.openaiApiKey` / `anthropicApiKey` are never logged
- **Add input rate limiting** per provider to control cost
- **Implement content filtering** on LLM responses (check for harmful/inappropriate content)

## Scalability Recommendations

- **Make LLMRouter configurable** — fallback order should be settable via env var (`LLM_PROVIDER_ORDER=openai,anthropic,ollama`)
- **Add provider health checking** — periodically verify provider connectivity and mark unavailable
- **Implement model-based routing** — route requests to providers based on model availability, not hardcoded ordering
- **Add provider load balancing** for multi-key setups
- **Separate LLM provider instances per tenant** for multi-tenant deployments

## DevOps & Infrastructure Improvements

- **Fix Docker build** — both `ai-ticket-shared-lib` and `ai-ticket-shared-schema` must be in build context
- Add `.dockerignore`, `HEALTHCHECK`, non-root user
- Add `/health` endpoint with individual provider connectivity checks
- Add Prometheus metrics: requests per provider, latency, token usage, error rate by provider

## Testing Improvements

- **Add test framework** (vitest) — currently zero tests
- **Provider tests**: mock HTTP responses for OpenAI/Anthropic/Ollama SDKs
- **Router tests**: fallback behavior, preferred provider, all-providers-failed scenario
- **Prompt template tests**: CRUD operations, version auto-increment race condition
- **Integration tests**: full analyze flow with mocked providers

## Developer Experience Improvements

- Add real ESLint config
- Add `tsconfig.json` paths aliases to fix deep imports (`../../../../../providers/router`)
- Make `LLM_DEFAULT_MODEL` and `LLM_FALLBACK_MODEL` actually consumed in code (currently documented but not used)
- Add `docker-compose.llm.yml` with Ollama service for local development

## Suggested New Features

- **Streaming endpoint** — SSE-based streaming for real-time agent assist (Phase 4 requirement)
- **Provider-specific model list API** — `GET /v1/providers/:name/models`
- **Prompt testing workspace** — sandbox to test prompts against models before promoting
- **Token usage tracking** per API key for cost allocation
- **Model fallback within a provider** — e.g., if `gpt-4` is rate-limited, fall back to `gpt-3.5-turbo`
- **Complete prompt CRUD** — add GET/:id, PUT/:id, DELETE/:id, PATCH/:id/activate

## Dependency Review

### Issues
- `@ai-ticket/shared-schema` is a dependency but only used by `prompts` service — consider whether prompts should be in this service or core-server
- `LLM_FALLBACK_MODEL` and `SERVICE_NAME` env vars are documented but not consumed — dead config

### Missing / Recommended
- `zod` — input validation
- `prom-client` — Prometheus metrics
- `lru-cache` — response caching
- `uuid` — correlation IDs
- `vitest` + `nock` — testing
- `morgan` — access logging

## Priority Roadmap

### High Priority
1. **Fix `as any` cast on provider param** — add type guard
2. **Add axios/SDK timeouts** — prevent hanging on provider calls
3. **Preserve error details in "All providers failed"** — debugging impossible currently
4. **Fix Docker build** — shared packages missing from build context
5. **Race condition in prompt versioning** — concurrent requests can create duplicate versions
6. **Add input validation schemas** for all endpoints

### Medium Priority
7. Add proper error handling for provider SDK errors (rate limits, auth, context length)
8. Fix deep relative imports with path aliases
9. Make fallback provider order configurable via env
10. Add token usage logging per request
11. Add prompt template variable validation
12. Add HTTP keep-alive for provider connections

### Low Priority
13. Add streaming endpoint for real-time agent assist
14. Add response caching with LRU
15. Implement model-based routing
16. Add provider health checks
17. Complete prompt CRUD (update, delete, activate)
18. Consume `LLM_DEFAULT_MODEL`/`LLM_FALLBACK_MODEL` from config
19. Real ESLint + Prettier
