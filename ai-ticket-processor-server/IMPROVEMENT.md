# Repository Improvement Report — ai-ticket-processor-server (AI Orchestration Service)

## Current Architecture Overview

The processor-server is a **REST API for AI ticket triage orchestration**. It exposes two endpoints (`POST /v1/triage/process` for single ticket, `POST /v1/triage/batch` for bulk) that fetch a ticket from core-server, call the LLM server for analysis, and save the triage result back. A keyword-based `applyRulesFallback` engine is used when the LLM is unavailable. The `src/agents/` directory exists but is empty — the multi-agent architecture is not yet implemented.

**Current structure:**
```
src/
├── index.ts                       # Express bootstrap
├── config.ts                      # Config via shared-lib spread
├── logger.ts                      # Winston via shared-lib
├── agents/                        # Reserved for multi-agent orchestration (empty)
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts       # Global error handler
│   ├── modules/
│   │   └── triage/v1/
│   │       ├── routes.ts          # POST /process, POST /batch
│   │       ├── controllers/       # Thin delegation to services
│   │       └── services/          # Core triage logic (154 lines)
│   └── routes/                    # Reserved (empty)
└── docs/
```

## ✅ Improvements Already Made

| Issue | Original Status | Current Status |
|---|---|---|
| `agents/` directory | Did not exist | Now exists (empty — reserved) |
| `rest/routes/` directory | Did not exist | Now exists (empty) |

## Folder Structure Improvements

### Follow scheduler-server pattern
Adopt the proven structure with `constant/`, `config/`, `handlers/`:
```
src/
├── index.ts
├── config/
│   ├── config.ts                  # Flat → directory with env-based overrides
│   └── triage.ts                  # Triage pipeline config (thresholds, fallback settings)
├── logger.ts
├── constant/
│   ├── service-constant.ts        # STATUS, AUDIT_ACTION, TRIAGE_CATEGORIES
│   └── prompt.constant.ts         # Prompt templates as constants
├── pipeline/                      # Extract from monolithic services/
│   ├── orchestrator.ts            # Pipeline coordinator
│   ├── ticket-fetcher.ts          # Fetch from core-server
│   ├── prompt-builder.ts          # Template rendering
│   ├── llm-analyzer.ts            # LLM communication
│   ├── fallback-engine.ts         # Rules-based fallback
│   └── result-persister.ts        # Save to core-server
├── handlers/
│   ├── triage.handler.ts          # Ticket processing handler
│   └── batch.handler.ts           # Batch processing handler
├── agents/                        # Multi-agent architecture (planned)
│   ├── types.ts
│   ├── orchestrator-agent.ts
│   ├── classifier-agent.ts
│   ├── priority-agent.ts
│   └── ...
├── rest/
│   ├── middlewares/
│   ├── modules/triage/v1/...
│   └── routes/
└── docs/
```

## Code Quality Improvements

### Type Safety
- **Eliminate all `any` types** — `ticket: any`, `llmResult: any`, `err: any`, `response.data: any`
- Define strong interfaces for the entire pipeline:
  ```typescript
  interface TicketData { id: string; subject: string; message: string; customerTier: string; sourceChannel: string; }
  interface LLMAnalysisResult { category: string; priority: string; sentiment: string; ... }
  interface TriageResult { ticketId: string; category: string; priority: string; ... }
  ```

### Error Handling
- **Add axios timeout** — every HTTP call should have explicit `timeout`
- **Add retry with exponential backoff** for transient failures
- **Wrap `JSON.parse(res.data.content)`** in explicit try/catch — LLM output may not be valid JSON
- **Fix `processBatch`** — replace `Promise.all` with `Promise.allSettled` for error isolation

### Validation
- Add `zod` schemas for all request inputs
- Validate LLM analysis output shape before accessing properties
- Validate `confidence` range (0-1), `temperature` range (0-2)

### Logging
- Add structured logging at each pipeline stage with timing
- Add correlation ID forwarding to downstream services
- Log LLM provider used, model, token count per request

## Performance Optimizations

- **Add connection pooling** for axios — reuse HTTP connections with keep-alive agent
- **Batch LLM calls** — process concurrently with semaphore limit
- **Cache prompt templates** in memory with TTL
- **Add circuit breaker** for downstream service calls (llm-server, core-server)

## Security Enhancements

- **Add prompt injection sanitization** — strip control characters and instruction overrides from ticket content
- **Validate `assignedTeam`** against configured team list
- **Add internal auth** — shared API key header between services
- **Sanitize logging** — ensure PII is not logged in production

## Scalability Recommendations

- **Implement proper agent architecture** — the monolithic triage function should delegate to specialized agents (Classifier, Priority, Sentiment, Routing, Reply, QA, Escalation, Learning)
- **Extract RAG** for reply generation — integrate vector search (pgvector/Pinecone)
- **Add event publishing** for triage completion (emit to queue for audit/metrics)

## DevOps & Infrastructure Improvements

### Docker
- **Fix Docker build** — shared-lib must be included in build context
- Add `.dockerignore` (follow scheduler-server pattern)
- Add `HEALTHCHECK` + non-root user
- Add `/health` endpoint checking connectivity to core-server and llm-server
- Add Prometheus metrics for pipeline duration, error rate, fallback rate

## Testing Improvements

- **Add test framework** (vitest) — currently zero test infrastructure
- **Unit tests** for: `applyRulesFallback`, `mapTeam`, `generateFallbackReply`, prompt builder
- **Integration tests** for: full triage pipeline with mocked HTTP (nock), fallback behavior, batch partial failures

## Developer Experience Improvements

- Add real ESLint + TypeScript-ESLint config
- Add `docker-compose.processor.yml` for local dependencies
- Add path aliases to `tsconfig.json`

## Suggested New Features

- **Multi-agent orchestrator** — implement all 9 agents from AGENTS.md
- **RAG-based reply generation** — vector search over KB articles
- **Confidence scoring breakdown** — per-agent confidence, not just overall
- **Human review queue endpoint** — return tickets flagged by escalation agent
- **A/B testing for prompts** — metrics per prompt template version

## Dependency Review

### Missing / Recommended
- `zod` — input validation
- `p-retry` — retry with backoff
- `opossum` — circuit breaker
- `prom-client` — metrics
- `vitest` + `nock` — testing

## Priority Roadmap

### High Priority
1. **Add axios timeouts** — every HTTP call can hang indefinitely
2. **Wrap `JSON.parse()` in try/catch** — LLM may return non-JSON
3. **Fix prompt injection vulnerability** — sanitize ticket content
4. **Fix `processBatch`** — use `Promise.allSettled` for error isolation
5. **Remove all `any` types** — ticket, llmResult, error handling
6. **Fix Docker build** — shared-lib missing in build context

### Medium Priority
7. Add Zod validation schemas for all inputs
8. Extract pipeline stages into separate modules
9. Add retry with backoff for LLM calls
10. Add circuit breaker for downstream dependencies
11. Add Prometheus metrics for pipeline timing
12. Add connection reuse for axios HTTP calls

### Low Priority
13. Implement multi-agent orchestration (9 agents from AGENTS.md)
14. Add RAG-based reply generation
15. A/B prompt testing with metrics
16. Populate or remove empty `agents/` and `rest/routes/`
17. Real ESLint + Prettier
