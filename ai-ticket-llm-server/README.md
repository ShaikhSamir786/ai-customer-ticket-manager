# @ai-ticket/llm-server

LLM provider abstraction service. Routes requests to OpenAI, Anthropic, or Ollama based on configuration. Handles prompt management and token tracking.

## Dependencies

- **Runtime**: None (standalone service)
- **Build**: `ai-ticket-shared-lib`, `ai-ticket-shared-schema`

## Setup

```bash
npm install
cp .env.sample .env   # configure API keys and model settings
npm run build
```

## Start

```bash
npm run dev      # development (ts-node-dev with hot reload)
npm start        # production (node dist/index.js)
```

Runs on port **3003** by default (`LLM_SERVER_PORT`).

## Startup Order

**Must be started first** (no runtime service dependencies):

```
1. PostgreSQL + Redis (infrastructure)
2. ai-ticket-llm-server  ← you are here
3. ai-ticket-core-server
4. ai-ticket-processor-server
5. ai-ticket-scheduler-server
6. ai-ticket-main-server
```
