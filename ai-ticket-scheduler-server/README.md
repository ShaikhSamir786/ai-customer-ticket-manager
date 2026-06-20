# @ai-ticket/scheduler-server

Background worker service. Consumes BullMQ queues, handles retries, runs cron jobs, SLA checks, and stale-ticket scans. Calls processor-server via REST for AI triage.

## Dependencies

- **Runtime**: Redis (BullMQ), `ai-ticket-core-server` (via REST), `ai-ticket-processor-server` (via REST)
- **Build**: `ai-ticket-shared-lib`, `ai-ticket-shared-schema`

## Setup

```bash
npm install
cp .env.sample .env   # configure REDIS_URL, CORE_SERVER_URL, PROCESSOR_SERVER_URL
npm run build
```

## Start

```bash
npm run dev      # development (ts-node-dev with hot reload)
npm start        # production (node dist/index.js)
```

No HTTP port exposed by default (internal worker).

## Startup Order

**Must be started after core-server and processor-server:**

```
1. PostgreSQL + Redis (infrastructure)
2. ai-ticket-llm-server
3. ai-ticket-core-server
4. ai-ticket-processor-server
5. ai-ticket-scheduler-server  ← you are here
6. ai-ticket-main-server
```
