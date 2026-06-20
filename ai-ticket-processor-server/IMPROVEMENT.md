# Repository Improvement Report — ai-ticket-processor-server (AI Orchestration Service)

## Current Architecture Overview

The processor-server is a **REST API for AI ticket triage orchestration**. It exposes two endpoints (`POST /v1/triage/process` for single ticket, `POST /v1/triage/batch` for bulk) that fetch a ticket from core-server, call the LLM server for analysis, and save the triage result back. A keyword-based `applyRulesFallback` engine is used when the LLM is unavailable.

**Current structure:**
```
src/
├── index.ts              # Express bootstrap
├── config.ts             # Config via shared-lib spread
├── logger.ts             # Winston via shared-lib
├── agents/               # Empty (reserved for multi-agent orchestration)
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts
│   ├── routes/           # Empty (reserved)
│   └── modules/triage/v1/
│       ├── routes.ts
│       ├── controllers/index.ts
│       └── services/index.ts   # Core triage logic (154 lines)
└── docs/
```

## Folder Structure Improvements

### Implement Multi-Agent Architecture
The `src/agents/` directory is empty but the AGENTS.md specifies 9 specialized agents. Implement the agent folder structure:
```
src/agents/
├── orchestrator.ts       # Plans workflow, delegates, aggregates
├── classifier.ts         # Categorizes ticket
├── priority-agent.ts     # Assigns urgency
├── sentiment-agent.ts    # Emotion analysis + churn prediction
├── routing-agent.ts      # Team assignment (skills + workload)
├── reply-agent.ts        # Response generation via RAG
├── escalation-agent.ts   # Flags human intervention needs
├── qa-agent.ts           # Reviews other agents' output
├── learning-agent.ts      # Improves from human overrides
├── types.ts             # Shared agent interfaces
└── index.ts             # Agent registry
```

### Extract Pipeline Stages
Current monolithic `services/index.ts` does everything in one function. Extract:
```
src/
├── pipeline/
│   ├── index.ts              # Orchestrator pipeline
│   ├── ticket-fetcher.ts     # Fetch from core-server
│   ├── prompt-builder.ts     # Template rendering
│   ├── llm-analyzer.ts       # LLM communication
│   ├── fallback-engine.ts    # Rules-based fallback (extract from services/)
│   ├── result-builder.ts     # Triage result construction
│   └── result-persister.ts   # Save to core-server
├── prompts/
│   ├── triage.prompt.ts      # Prompt templates as TypeScript
│   └── prompt-service.ts     # Load from DB or compile
├── validators/
│   └── triage.validator.ts   # Zod schemas for I/O
```

## Code Quality Improvements

### Type Safety
- **Eliminate all `any` types** — `ticket: any`, `llmResult: any`, `err: any`, `response.data: any`
- Define strong interfaces for the entire pipeline:
  ```typescript
  interface TicketData { id: string; subject: string; message: string; customerTier: string; sourceChannel: string; }
  interface LLMAnalysisResult { category: string; priority: string; sentiment: string; assignedTeam: string; confidence: number; needsHumanReview: boolean; suggestedReply: string; churnRisk: number; }
  interface TriageResult { ticketId: string; category: string; priority: string; ... }
  ```
- **Remove `response.data as any`** in `processBatch` — type the axios response generically

### Error Handling
- **Add axios timeout** — every HTTP call should have explicit timeout:
  ```typescript
  axios.get(url, { timeout: 10000 })
  ```
- **Add retry with exponential backoff** for transient failures (LLM server 503, network hiccups):
  ```typescript
  import pRetry from 'p-retry';
  await pRetry(() => axios.post(...), { retries: 3, minTimeout: 1000 });
  ```
- **Wrap `JSON.parse(res.data.content)`** in explicit try/catch — LLM output may not be valid JSON
- **Fix `processBatch`** — replace `Promise.all` with `Promise.allSettled` to isolate failures:
  ```typescript
  const results = await Promise.allSettled(ticketIds.map(id => processTicket(id)));
  return {
    succeeded: results.filter(r => r.status === 'fulfilled').map(r => r.value),
    failed: results.filter(r => r.status === 'rejected').map(r => r.reason),
  };
  ```

### Validation
- Add `zod` schemas for all request inputs:
  ```typescript
  const processTicketSchema = z.object({ ticketId: z.string().uuid() });
  const processBatchSchema = z.object({ ticketIds: z.array(z.string().uuid()).min(1).max(100) });
  ```
- Validate LLM analysis output shape before accessing properties
- Validate `confidence` range (0-1), `temperature` range (0-2)
- Add response validation to catch upstream contract violations

### Logging
- Add structured logging at each pipeline stage with timing:
  ```typescript
  logger.info('Pipeline stage complete', { stage: 'llm_analysis', ticketId, durationMs });
  ```
- Log LLM provider used, model, token count per request
- Add correlation ID forwarding to downstream services

## Performance Optimizations

- **Add connection pooling** for axios — reuse HTTP connections to core-server and llm-server using `axios-hooks` or keep-alive agent
- **Batch LLM calls** for `processBatch` — process concurrently but with a semaphore limit (e.g., 5 concurrent)
- **Cache prompt templates** in memory with TTL instead of re-fetching from core-server each time
- **Add circuit breaker** for downstream service calls (llm-server, core-server)
- **Measure and log pipeline timing** for SLA tracking and optimization (AGENTS.md mentions SLA tracking)

## Security Enhancements

- **Add prompt injection sanitization** — strip or escape control characters, special tokens, and instruction overrides from ticket content before template interpolation
- **Validate `assignedTeam`** against configured team list — prevent arbitrary team names in triage results from LLM
- **Add internal auth** between services — at minimum a shared API key header
- **Sanitize logging** — ensure ticket content (PII) is not logged in production
- **Rate limit `/v1/triage/process`** — prevent abuse from compromised services

## Scalability Recommendations

- **Implement proper agent architecture** — the monolithic triage function should delegate to specialized agents as documented:
  ```typescript
  class Orchestrator {
    async triage(ticket: TicketData): Promise<TriageResult> {
      const category = await classifier.classify(ticket);
      const priority = await priorityAgent.assignPriority(ticket);
      const sentiment = await sentimentAgent.analyze(ticket);
      const team = await routingAgent.route(category, priority);
      const reply = await replyAgent.generate(ticket, category);
      const qaResult = await qaAgent.review({ category, priority, sentiment, reply });
      const needsEscalation = await escalationAgent.evaluate({ ticket, qaResult });
      return { category, priority, sentiment, assignedTeam: team, ... };
    }
  }
  ```
- **Extract RAG (Retrieval-Augmented Generation)** for reply generation — integrate vector search (pgvector or Pinecone) as documented in Phase 4
- **Add event publishing** for triage completion (emit to queue for audit/metrics)

## DevOps & Infrastructure Improvements

- **Fix Docker build** — shared-lib must be included in build context
- Add `.dockerignore`, `HEALTHCHECK`, non-root user
- Add `NODE_ENV=production` in final Docker stage
- Add `/health` endpoint that checks connectivity to core-server and llm-server
- Add Prometheus metrics for pipeline duration, error rate, fallback rate

## Testing Improvements

- **Add test framework** (vitest) — currently zero test infrastructure
- **Unit tests** for:
  - `applyRulesFallback` — comprehensive keyword matching coverage
  - `mapTeam` — category-to-team mapping
  - `generateFallbackReply` — template rendering
  - Prompt builder — template interpolation correctness
- **Integration tests** for:
  - Full triage pipeline with mocked HTTP services (nock or msw)
  - Fallback engine behavior when LLM is down
  - Batch processing with partial failures
- **Property-based tests** for prompt template handling

## Developer Experience Improvements

- Add real ESLint + TypeScript-ESLint config
- Add `docker-compose.processor.yml` for local dependencies
- Add debug logging toggle for pipeline execution tracing
- Make `LLM_SERVER_URL` and `CORE_SERVER_URL` configurable in `.env` with defaults

## Suggested New Features

- **Multi-agent orchestrator** — implement all 9 agents from AGENTS.md
- **RAG-based reply generation** — vector search over KB articles + past replies
- **Confidence scoring detailed breakdown** — per-agent confidence, not just overall
- **Human review queue endpoint** — return tickets flagged by escalation agent
- **Process by scheduled SLA** — ability to re-process tickets on SLA breach
- **Model version tracking** — log which model version produced each analysis
- **A/B testing for prompts** — metrics per prompt template version

## Dependency Review

### Missing / Recommended
- `zod` — input validation
- `p-retry` — retry with backoff
- `opossum` or `cockatiel` — circuit breaker
- `prom-client` — Prometheus metrics
- `uuid` — correlation IDs
- `vitest` + `nock` — testing
- `morgan` or `pino-http` — access logging

## Priority Roadmap

### High Priority
1. **Add axios timeouts** — every HTTP call can hang indefinitely
2. **Wrap `JSON.parse()` in try/catch** — LLM may return non-JSON
3. **Fix prompt injection vulnerability** — sanitize ticket content
4. **Fix `processBatch`** — use `Promise.allSettled` for error isolation
5. **Remove all `any` types** — ticket, llmResult, error handling
6. **Fix Docker build** — shared-lib missing in build context
7. **Add correlation ID middleware** for request tracing

### Medium Priority
8. Add Zod validation schemas for all inputs
9. Extract pipeline stages into separate modules
10. Implement proper agent architecture from AGENTS.md
11. Add retry with backoff for LLM calls
12. Add circuit breaker for downstream dependencies
13. Add Prometheus metrics for pipeline timing
14. Add connection reuse for axios HTTP calls

### Low Priority
15. Add RAG-based reply generation
16. Implement multi-agent orchestration (9 agents)
17. A/B prompt testing with metrics
18. Human review queue endpoint
19. Cross-platform clean script
20. Real ESLint + Prettier
