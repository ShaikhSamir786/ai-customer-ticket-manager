# 🤖 AI Customer Ticket Manager

A production-grade, microservice-based customer support automation and triage platform. The system ingests support tickets, classifies them with LLMs, determines urgency and customer sentiment, routes them to the best-suited agent based on skills and availability, tracks SLA compliance, and generates contextual response drafts.

---

## 🏗️ System Architecture

The platform is designed around a decoupled microservices architecture to ensure scalability, fault isolation, and independent deployment cycles.

```
[ Frontend (Agent Dashboard) ]
             │
             ▼ (GraphQL)
┌───────────────────────────────┐
│     ai-ticket-main-server     │   ◄── (API Gateway: Validation, Auth, Rate Limiting)
└────────────┬──────────────────┘
             │
             ▼ (REST / JSON)
┌───────────────────────────────┐
│     ai-ticket-core-server     │   ◄── (State Engine: Ticket CRUD, Db Storage, Audit Logs)
└────────────┬──────────────────┘
             │
             ▼ (Push Job)
┌───────────────────────────────┐
│       BullMQ / Redis          │   ◄── (Asynchronous Message Broker / Queue)
└────────────┬──────────────────┘
             │
             ▼ (Pop Job)
┌───────────────────────────────┐
│  ai-ticket-scheduler-server   │   ◄── (Workers & Cron: SLA Checks, Stale Scans, Queue Consumers)
└────────────┬──────────────────┘
             │
             ▼ (REST)
┌───────────────────────────────┐
│  ai-ticket-processor-server   │   ◄── (AI Triage: Intent, Sentiment, Skill-based Agent Routing)
└────────────┬──────────────────┘
             │
             ▼ (REST)
┌───────────────────────────────┐
│     ai-ticket-llm-server      │   ◄── (LLM Gateway: Provider Abstraction, Prompts, Token Logs)
└────────────┬──────────────────┘
             │
             ├──────────────────────────────┬──────────────────────────────┐
             ▼                              ▼                              ▼
     [ OpenAI API ]                 [ Anthropic API ]              [ Ollama (Local) ]
```

### End-to-End Execution Flow
1. **Ingestion**: A ticket is submitted (from user, email, chatbot, or webhook) and hits the `main-server` API gateway.
2. **Persistence**: The `main-server` validates the payload and forwards it to the `core-server`, which writes the raw ticket into PostgreSQL and pushes a job to Redis (BullMQ).
3. **Queue Consumption**: The `scheduler-server` picks up the job asynchronously, ensuring client APIs remain fast and responsive.
4. **AI Triage**: The `scheduler-server` asks `processor-server` to perform triage. The `processor-server` evaluates the ticket contents using prompt chains through the `llm-server`.
5. **Model Routing**: The `llm-server` handles raw model APIs (OpenAI, Anthropic, or local Ollama), logs tokens, and returns structured data.
6. **Classification & Assignment**: The `processor-server` determines intent, severity, and target department, runs the **Skill-Based Routing Engine** to select the best available agent, and drafts a reply.
7. **Resolution**: The `core-server` updates the ticket state, logs the transaction in the audit trail, and pushes updates to the Agent Dashboard.

---

## 📁 Repository Directory Map

This monorepo coordinates the following services and packages:

| Directory | Type | Description |
|:---|:---|:---|
| [**`ai-ticket-main-server`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-main-server) | Service | **API Gateway**: Handles client auth, rate limiting, and routes requests to core microservices. |
| [**`ai-ticket-core-server`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-core-server) | Service | **Core Engine**: Implements the main ticket lifecycle, CRUD endpoints, and seeds default employees. |
| [**`ai-ticket-processor-server`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-processor-server) | Service | **AI Orchestrator**: Executes sentiment analyses, urgency scores, and skill-based agent matching. |
| [**`ai-ticket-llm-server`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-llm-server) | Service | **LLM Gateway**: Manages model providers, token usage metrics, prompt templates, and rate limits. |
| [**`ai-ticket-scheduler-server`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-scheduler-server) | Service | **Worker Daemon**: Consumes queues, triggers SLA compliance checks, and runs stale scans. |
| [**`ai-ticket-shared-schema`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-shared-schema) | Library | **Shared DB Schema**: Centralized database models (Sequelize) and schema migrations. |
| [**`ai-ticket-shared-lib`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-shared-lib) | Library | **Shared Utilities**: Logging middleware, configuration managers, queues, and error wrappers. |
| [**`ai-ticket-web-app-react-graphql`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-web-app-react-graphql) | Frontend | **Agent Dashboard**: Ticket list, triage panel, overrides, and analytics (React + GraphQL). |
| [**`ai-ticket-project-docs`**](file:///s:/projects/ai-customer-ticket-manager/ai-ticket-project-docs) | Docs | System flow diagrams, database diagrams, API references, and architecture choices. |
| [**`observability`**](file:///s:/projects/ai-customer-ticket-manager/observability) | Config | Configuration files for Prometheus metrics, Grafana dashboards, and Tempo trace collection. |
| [**`backend-skills`**](file:///s:/projects/ai-customer-ticket-manager/backend-skills) | Skills | Specialized agent skill files for backend tasks (API, DB, security, audits, performance). |
| [**`frontend-skills`**](file:///s:/projects/ai-customer-ticket-manager/frontend-skills) | Skills | Specialized agent skill files for frontend tasks (design system, components, aesthetics). |
| [**`scripts`**](file:///s:/projects/ai-customer-ticket-manager/scripts) | Scripts | Internal helper utilities to build, clean, and validate all projects across the workspace. |

---

## 🛠️ Technology Stack

* **Runtime**: Node.js & TypeScript
* **Database**: PostgreSQL (Relational persistence)
* **ORM & Migrations**: Sequelize (`sequelize-typescript` decorators)
* **Queue & Cache**: Redis (via BullMQ)
* **API Standards**: GraphQL (for Gateway) & REST (for internal service-to-service calls)
* **AI Providers**: OpenAI (GPT-4), Anthropic (Claude), Ollama (Local LLM runtimes)
* **Observability**: Prometheus, Grafana, Tempo (PLGT Stack) and structured Winston JSON logging with trace-correlation.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Docker & Docker Compose** (for PostgreSQL, Redis, Grafana, Prometheus)
- **Git**

### 2. Initial Setup
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd ai-customer-ticket-manager
   ```

2. **Initialize local environment variables**:
   Each service contains an `.env.sample` file. Copy these files to `.env` in their respective directories and fill in database credentials and LLM provider API keys:
   - `ai-ticket-core-server/.env`
   - `ai-ticket-main-server/.env`
   - `ai-ticket-llm-server/.env`
   - `ai-ticket-processor-server/.env`
   - `ai-ticket-scheduler-server/.env`

3. **Start external dependencies**:
   Spin up Redis and PostgreSQL with Docker:
   ```bash
   docker-compose up -d
   ```
   Optionally start the PLGT observability stack (Prometheus, Loki, Grafana, Tempo):
   ```bash
   docker-compose -f docker-compose.observability.yml up -d
   ```

### 3. Build & Validate the Workspace
We provide helper scripts at the workspace level for orchestration. Run them from the project root:

```bash
# Build all packages in dependency-aware order (shared libraries first)
npm run build

# Run type-checking across all services
npm run typecheck

# Run type-checking across all services
npm run typecheck

# Run linter checks
npm run lint

# Validate workspace packages configurations
npm run validate

# Clean up all build output folders (dist/ & node_modules/ caches)
npm run clean

# Start all services in development mode (shared build + parallel dev servers)
npm run dev
```

### 4. Running Services Locally
After configuring variables, you can start individual microservices. Build dependencies first, then navigate into the service subdirectory and launch:
```bash
# Building first
npm run build

# Running a specific service
cd ai-ticket-core-server
npm run dev
```

---

## 🧩 AI Agent Instructions

If you are an AI assistant or coding agent working on this workspace, please refer to the detailed guidelines in [**`AGENTS.md`**](file:///s:/projects/ai-customer-ticket-manager/AGENTS.md).

Always activate the relevant specialized skill from [`backend-skills/`](file:///s:/projects/ai-customer-ticket-manager/backend-skills) or [`frontend-skills/`](file:///s:/projects/ai-customer-ticket-manager/frontend-skills) before tackling specialized issues (e.g. database schema migrations, API architecture changes, audit logging, frontend components).
