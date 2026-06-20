# AI Customer Ticket Manager — Agent Instructions

**IMPORTANT: Every AI agent operating in this workspace MUST use this file as its primary instructional foundation. Before performing any specialized task, you MUST activate the corresponding agent skill from the `@agents/` directory using the `activate_skill` tool.**

This file instructs AI agents on how to build this project. Load the appropriate specialized agent(s) from `@agents` to execute tasks, and consult `ai-ticket-project-docs/` for detailed specifications.

---

## Available Specialized Agents

| Agent File | Role | Skill Name (for `activate_skill`) | When to Load |
|---|---|---|---|
| `@agents/api-architect-agent.md` | API design, contracts, gateway config | `api-architect-agent` | Designing REST/GraphQL endpoints, OpenAPI specs, API security |
| `@agents/audit-logging-agent.md` | Audit trails, compliance logging | `audit-logging-agent` | Implementing structured logging, audit history, compliance (use winston) |
| `@agents/backend-engineer.md` | Full-stack backend dev team (10 roles) | `backend-engineer` | General implementation: API logic, DB, auth, caching, CI/CD |
| `@agents/database-engineer-agent.md` | Data modeling, query optimization, migrations | `database-engineer-agent` | Schema design, Prisma models, indexing, migration planning |
| `@agents/documentation-agent.md` | Technical docs, ADRs, runbooks | `documentation-agent` | Generating READMEs, API docs, architecture diagrams, changelogs |
| `@agents/microservices-architect-agent.md` | Service decomposition, inter-service comm | `microservices-architect-agent` | Designing service boundaries, event-driven patterns, resilience |
| `@agents/performance-optimization-team.md` | Latency, throughput, load testing | `performance-optimization-team` | Profiling, caching strategies, query optimization, capacity planning |
| `@agents/security-engineering-team.md` | AppSec, IAM, cloud security, compliance | `security-engineering-team` | Auth flows, RBAC, secrets management, vulnerability scanning |

---

## Project Architecture (from `ai-ticket-project-docs/project-context.md`)

This is a **microservice-based support automation platform** with these repos:

| Repo | Type | Role |
|---|---|---|
| `ai-ticket-main-server` | Gateway | Auth, validation, rate limiting, routes requests to internal services |
| `ai-ticket-core-server` | Core service | Ticket CRUD, assignment, status tracking, audit history |
| `ai-ticket-processor-server` | AI service | Orchestrates triage: classification, priority, routing, reply generation |
| `ai-ticket-llm-server` | LLM service | Provider abstraction (OpenAI/Anthropic/Ollama), prompt mgmt, token tracking |
| `ai-ticket-scheduler-server` | Background worker | Queue consumers, retries, cron jobs, SLA checks, stale-ticket scans |
| `ai-ticket-shared-schema` | Shared lib | Sequelize models + TypeScript types shared across services |
| `ai-ticket-shared-lib` | Shared lib | Logger, config loader, error handling, queue constants, decorators |
| `ai-ticket-web-nextjs` | Frontend | Landing page with project info only (no dashboard) |
| `ai-ticket-web-app-react-graphql` | Frontend | Agent dashboard: ticket list, triage panel, overrides, analytics |

---

## Communication Model (from `ai-ticket-project-docs/services-communication.md`)

```
Frontend (GraphQL) → Gateway → Core (REST) → Queue → Scheduler → Processor → LLM
```

- **Frontend ↔ Gateway**: GraphQL
- **Internal Services**: REST (JSON)
- **Async Processing**: BullMQ (default) or Kafka (env-switch: `QUEUE_TYPE`)
- **Scheduler ↔ Processor**: REST (sync) over HTTP

### End-to-End Flow

1. Ticket submitted → `main-server` validates → forwards to `core-server`
2. `core-server` stores ticket, pushes job to queue
3. `scheduler-server` consumes job → calls `processor-server` via REST
4. `processor-server` applies business rules → calls `llm-server`
5. `llm-server` routes to AI provider → returns structured analysis
6. `processor-server` returns triage result → `core-server` updates ticket
7. Agent dashboard displays results → agent can approve/override/reply

---

## Triage AI Agent Architecture (from `ai-ticket-project-docs/ai-agents-detailed.md`)

The processor server implements a **multi-agent orchestration** pattern:

| Agent | Role |
|---|---|
| **Orchestrator** | Plans workflow, delegates to specialized agents, aggregates results |
| **Classifier** | Categorizes ticket (billing, technical, account, product) |
| **Priority Agent** | Assigns urgency (critical/high/medium/low) with weighted factors |
| **Sentiment Agent** | Analyzes emotion, churn risk prediction |
| **Routing Agent** | Assigns team based on skills + workload balancing |
| **Reply Agent** | Generates response via RAG (retrieves KB articles + past replies) |
| **Escalation Agent** | Flags human intervention needed (low confidence, legal, VIP) |
| **QA Agent** | Reviews other agents' output (accuracy, tone, hallucination check) |
| **Learning Agent** | Improves from human overrides (few-shot learning, fine-tuning) |

---

## Features to Build (from `ai-ticket-project-docs/feature.md`)

### Phase 1 — Foundation (P0)
- Ticket CRUD
- Basic AI analysis (category + priority)
- Agent dashboard (ticket list with AI annotations)
- Manual override controls

### Phase 2 — Core Value (P0/P1)
- AI reply generation
- Team routing
- SLA tracking
- Manager metrics dashboard

### Phase 3 — Optimization (P1/P2)
- Confidence scoring & human review queue
- Bulk operations
- Customer ticket tracking portal
- Webhook system

### Phase 4 — Advanced (P2/P3)
- RAG with vector search (pgvector/Pinecone)
- Sentiment & churn prediction
- Predictive volume forecasting
- Real-time agent assist (streaming)

---

## Workflow Instructions

### When starting a new service/repo:
1. Activate **microservices-architect-agent** skill for service boundaries & communication design
2. Activate **api-architect-agent** skill for endpoint contracts & gateway integration
3. Activate **database-engineer-agent** skill for schema design and migrations
4. Activate **backend-engineer** skill for implementation
5. Activate **security-engineering-team** skill for auth, RBAC, and compliance

### When implementing triage logic:
1. Consult `ai-ticket-project-docs/ai-agents-detailed.md` for agent design
2. Activate **backend-engineer** skill for processor server orchestration
3. Activate **api-architect-agent** skill for LLM server provider abstraction
4. Reference `ai-ticket-project-docs/scheduler_processor.md` for queue flow

### When adding observability:
1. Activate **audit-logging-agent** skill (uses winston per its instructions)
2. Consult `ai-ticket-project-docs/obserbility.md` for PLGT stack setup
3. Activate **performance-optimization-team** skill for metrics & alerting

### When generating documentation:
1. Activate **documentation-agent** skill
2. Consult `ai-ticket-project-docs/folder-structure-rest-server.md` and `ai-ticket-project-docs/folder-structure-graphql-server.md` for conventions

---

## Folder Structure Conventions

All services follow established patterns from existing codebases. Refer to these docs when scaffolding:

### REST Server Convention (`ai-ticket-project-docs/folder-structure-rest-server.md`)

```
src/
├── index.ts                          # Entry point
├── config.ts                         # App configuration
├── logger.ts                         # Logger setup
├── redis-client.ts                   # Redis client
├── boot/                             # Bootstrapping (index, keep-alive)
├── constants/                        # App constants (error types, etc.)
├── enums/                            # TypeScript enums
├── types/                            # TypeScript type definitions
├── functions/                        # Shared utility functions
├── utils/                            # Utility modules (auth, jwt, rest helpers)
├── rest/
│   ├── middlewares/                  # Error handler, auth, rate-limit, etc.
│   ├── routes/                       # Route definitions (index, v1)
│   └── modules/                      # Feature modules
│       └── <module>/
│           ├── v1/
│           │   ├── controllers/
│           │   ├── services/
│           │   └── routes.ts
│           └── <module>-logger.ts
└── schema/                           # Database schemas + migrations
```

### GraphQL Server Convention (`ai-ticket-project-docs/folder-structure-graphql-server.md`)

```
src/
├── start-apollo-server.js            # Apollo GraphQL entry
├── config/                           # App configuration
├── logger.js                         # Logger setup
├── boot/                             # Boot scripts (data init)
├── schema/                           # DB schemas (migrations + models)
├── services/                         # External integrations (Slack, Discord, etc.)
├── modules/                          # GraphQL modules (feature domains)
│   └── <module>/
│       ├── resolvers/
│       ├── services/
│       └── schemas/
├── rest/                             # REST API layer (middlewares, routes, modules)
├── shared-lib/                       # Shared lib (logger, queue, providers, utils)
├── utils/                            # Auth, intl, file upload, validations
├── scalars/                          # Custom GraphQL scalars
├── directives/                       # Custom GraphQL directives
└── pubsub/                           # PubSub system
```

### When making security-sensitive changes:
1. Always activate **security-engineering-team** skill
2. Run threat modeling (STRIDE) and reference OWASP Top 10

---

## Conventions

- **Stack**: Node.js, TypeScript, PostgreSQL, Sequelize, Redis, BullMQ, Docker
- **LLM Providers**: OpenAI (GPT-4/GPT-3.5-Turbo), Anthropic (Claude), Ollama (local)
- **Logging**: winston structured JSON logs with correlation IDs
- **Service pattern**: Use `@agents/backend-engineer.md` team roles (ArchitectAI, APIWizard, DataModeler, etc.)
- **Always** read relevant `ai-ticket-project-docs/` files before implementing a feature
- **Always** use `activate_skill` to load an agent from `@agents/` before starting work on a specialized task
- Run `npm run typecheck` from root after any changes (uses `scripts/typecheck.js`)
- Build shared packages first (`npm run build` runs `scripts/build.js` with dependency-aware ordering)
- Each repo has its own `node_modules` (not hoisted to root)
- Each service has its own `.env.sample` — copy to `.env` and configure per-service
- Shared packages are referenced via `file:../ai-ticket-shared-*` paths
