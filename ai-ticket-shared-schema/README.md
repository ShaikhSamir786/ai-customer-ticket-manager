# @ai-ticket/shared-schema

Shared database schemas — Sequelize models and TypeScript types shared across services.

## Dependencies

- **Runtime**: PostgreSQL (via Sequelize)
- **Build**: Must be built after `ai-ticket-shared-lib` and before any service that depends on it

## Setup

```bash
npm install
npm run build
```

### Database Migrations

Ensure PostgreSQL is running, then:

```bash
cp .env.sample .env   # configure DATABASE_URL
npm run db:migrate     # run migrations
npm run migrate:undo   # rollback last migration
```

## Start

This is a library, not a server — no need to run it. Just build it and run migrations.

## Build Order

Build **immediately after** `ai-ticket-shared-lib`, before any server:

```bash
npm run build
```
