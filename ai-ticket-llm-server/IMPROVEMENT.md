# Repository Improvement Report — ai-ticket-llm-server (LLM Provider Abstraction)

## Current Architecture Overview

The llm-server is a **REST API for LLM provider abstraction**. It exposes `POST /v1/analyze` (default fallback chain) and `POST /v1/analyze/:provider` (specific provider), plus `GET/POST /v1/prompts` (prompt template CRUD). It uses a `Provider` abstraction with `LLMRouter` implementing Chain-of-Responsibility (OpenAI → Anthropic → Ollama) with automatic provider registration based on API keys.

**Current structure:**
```
src/
├── index.ts                       # Express bootstrap
├── config.ts                      # Config via shared-lib spread
├── logger.ts                      # Winston via shared-lib
├── providers/
│   ├── types.ts                   # LLMProvider interface + types
│   ├── router.ts                  # LLMRouter fallback chain
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   └── ollama-provider.ts
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts
│   ├── modules/
│   │   ├── analyze/v1/            # Routes, controllers, services
│   │   └── prompts/v1/            # Routes, controllers, services
│   └── routes/                    # Reserved (empty)
└── docs/
```

## ✅ Improvements Already Made

| Issue | Original Status | Current Status |
|---|---|---|
| `rest/routes/` directory | Did not exist | Now exists (empty — reserved) |

## Folder Structure Improvements

### Follow scheduler-server pattern
Adopt the proven structure with `constant/`, `config/`, `handlers/`:
```
src/
├── index.ts
├── config/
│   ├── config.ts
│   ├── llm-providers.ts           # Provider configs (model names, endpoints)
│   └── prompts.ts                 # Prompt configs
├── logger.ts
├── constant/
│   ├── service-constant.ts        # Provider names, model constants
│   └── prompt.constant.ts         # Default prompt templates
├── providers/
│   ├── types.ts
│   ├── router.ts
│   ├── base-provider.ts           # Abstract base with retry, timing, token counting
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   └── ollama-provider.ts
├── handlers/
│   ├── analyze.handler.ts         # Extracted from analyze services
│   └── prompts.handler.ts         # Extracted from prompt services
├── rest/
│   ├── middlewares/
│   ├── modules/
│   │   ├── analyze/v1/...
│   │   └── prompts/v1/...
│   └── routes/
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Remove `as any` casts** — especially `req.params.provider as any`. Add type guard:
  ```typescript
  const PROVIDER_TYPES = ['openai', 'anthropic', 'ollama'] as const;
  type ProviderType = typeof PROVIDER_TYPES[number];
  function isProviderType(val: string): val is ProviderType {
    return PROVIDER_TYPES.includes(val as ProviderType);
  }
  ```
- **Replace `Record<string, any>`** for options with typed `AnalyzeOptions` interface
- **Fix return type duplication** in router — use `LLMResponse & { provider: string }`

### Error Handling
- **Preserve error details in "All providers failed"** — include which providers and why
- **Add provider-specific error handling** for rate limits (429), context length exceeded, auth failures
- **Handle empty/partial responses** — validate `response.choices[0]` exists

### Validation
- Add Zod schemas for analyze request/response
- Add prompt template validation (validate variables match template placeholders)
- Validate `provider` parameter against available providers

### Logging
- Log token usage per provider request (partially done)
- Add correlation ID to all log entries
- Log LLM response latency with percentile tracking

## Performance Optimizations

- **Add HTTP keep-alive** for provider SDKs
- **Add response caching** for identical prompts (LRU cache with TTL)
- **Add timeout configuration** per provider
- **Add concurrent request limiting** per provider to avoid rate limit spikes

## Security Enhancements

- **Sanitize prompts before sending to LLM providers** — strip PII
- **Add prompt length limits** to avoid cost spikes
- **Mask API keys in logs** — ensure `config.llm.openaiApiKey` etc. are never logged
- **Add input rate limiting** per provider to control cost

## Scalability Recommendations

- **Make LLMRouter configurable** — fallback order via env var (`LLM_PROVIDER_ORDER`)
- **Add provider health checking** — periodically verify provider connectivity
- **Implement model-based routing** — route based on model availability
- **Add provider load balancing** for multi-key setups

## DevOps & Infrastructure Improvements

### Docker
- **Fix Docker build** — both shared packages must be in build context
- Add `.dockerignore` (follow scheduler-server pattern)
- Add `HEALTHCHECK` + non-root user
- Add `/health` endpoint with individual provider connectivity checks
- Add Prometheus metrics: requests per provider, latency, token usage, error rate

## Testing Improvements

- **Add test framework** (vitest) — currently zero tests
- **Provider tests**: mock HTTP responses for OpenAI/Anthropic/Ollama SDKs
- **Router tests**: fallback behavior, preferred provider, all-providers-failed scenario
- **Prompt template tests**: CRUD, version auto-increment race condition

## Developer Experience Improvements

- Add real ESLint config (replace `echo 'lint ok'`)
- Add path aliases to `tsconfig.json` for clean imports
- Make `LLM_DEFAULT_MODEL` and `LLM_FALLBACK_MODEL` actually consumed in code (documented but not used)
- Add `docker-compose.llm.yml` with Ollama for local development

## Suggested New Features

- **Streaming endpoint** — SSE-based streaming for real-time agent assist (Phase 4)
- **Provider-specific model list API** — `GET /v1/providers/:name/models`
- **Prompt testing workspace** — sandbox to test prompts before promoting
- **Token usage tracking** per API key for cost allocation
- **Complete prompt CRUD** — add GET/:id, PUT/:id, DELETE/:id, PATCH/:id/activate

## Dependency Review

### Issues
- `@ai-ticket/shared-schema` is a dependency but only used by `prompts` module — consider decoupling
- `LLM_FALLBACK_MODEL` and `SERVICE_NAME` env vars documented but not consumed

### Missing / Recommended
- `zod` — input validation
- `prom-client` — metrics
- `lru-cache` — response caching
- `vitest` + `nock` — testing

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
11. Add HTTP keep-alive for provider connections

### Low Priority
12. Add streaming endpoint for real-time agent assist
13. Add response caching with LRU
14. Complete prompt CRUD (update, delete, activate)
15. Consume `LLM_DEFAULT_MODEL`/`LLM_FALLBACK_MODEL` from config
16. Populate or remove empty `rest/routes/`
17. Real ESLint + Prettier
