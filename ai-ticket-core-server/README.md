# @ai-ticket/core-server

Core service — ticket CRUD, assignment, status tracking, and audit history. Pushes jobs to BullMQ queue for AI processing.

## Dependencies

- **Runtime**: PostgreSQL, Redis
- **Build**: `ai-ticket-shared-lib`, `ai-ticket-shared-schema`

## Setup

```bash
npm install
cp .env.sample .env   # configure DATABASE_URL, REDIS_URL, JWT_SECRET
npm run build
```

Ensure PostgreSQL and Redis are running, then run migrations from `ai-ticket-shared-schema`.

## Start

```bash
npm run dev      # development (ts-node-dev with hot reload)
npm start        # production (node dist/index.js)
```

Runs on port **3001** by default (`CORE_SERVER_PORT`).

## Startup Order

**Must be started after LLM server:**

```
1. PostgreSQL + Redis (infrastructure)
2. ai-ticket-llm-server
3. ai-ticket-core-server  ← you are here
4. ai-ticket-processor-server
5. ai-ticket-scheduler-server
6. ai-ticket-main-server
```
