# @ai-ticket/main-server

API Gateway — GraphQL server (Apollo) with auth, validation, rate limiting. Routes requests to internal services (core, processor, llm). This is the public-facing entry point.

## Dependencies

- **Runtime**: `ai-ticket-core-server` (via REST), `ai-ticket-processor-server` (via REST), `ai-ticket-llm-server` (via REST)
- **Build**: `ai-ticket-shared-lib`

## Setup

```bash
npm install
cp .env.sample .env   # configure JWT_SECRET, CORE_SERVER_URL, PROCESSOR_SERVER_URL, LLM_SERVER_URL
npm run build
```

## Start

```bash
npm run dev      # development (ts-node-dev with hot reload)
npm start        # production (node dist/index.js)
```

Runs on port **4000** by default (`MAIN_SERVER_PORT`).

## Startup Order

**Must be started last** (depends on all other services):

```
1. PostgreSQL + Redis (infrastructure)
2. ai-ticket-llm-server
3. ai-ticket-core-server
4. ai-ticket-processor-server
5. ai-ticket-scheduler-server
6. ai-ticket-main-server  ← you are here (start last)
```
