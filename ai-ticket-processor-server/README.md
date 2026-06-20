# @ai-ticket/processor-server

AI orchestration service. Implements multi-agent triage (classifier, priority, sentiment, routing, reply, escalation, QA agents). Called synchronously by the scheduler server via REST.

## Dependencies

- **Runtime**: `ai-ticket-core-server` (via REST), `ai-ticket-llm-server` (via REST)
- **Build**: `ai-ticket-shared-lib`

## Setup

```bash
npm install
cp .env.sample .env   # configure CORE_SERVER_URL, LLM_SERVER_URL
npm run build
```

## Start

```bash
npm run dev      # development (ts-node-dev with hot reload)
npm start        # production (node dist/index.js)
```

Runs on port **3002** by default (`PROCESSOR_SERVER_PORT`).

## Startup Order

**Must be started after core-server and llm-server:**

```
1. PostgreSQL + Redis (infrastructure)
2. ai-ticket-llm-server
3. ai-ticket-core-server
4. ai-ticket-processor-server  ← you are here
5. ai-ticket-scheduler-server
6. ai-ticket-main-server
```
