# @ai-ticket/shared-lib

Shared library providing logger (winston), config loader, error handling, queue constants, and decorators used across all services.

## Dependencies

- **Runtime**: None (standalone shared library)
- **Build**: Must be built before any service that depends on it

## Setup

```bash
npm install
npm run build
```

## Start

This is a library, not a server — no need to run it. Just build it.

## Build Order

Must be built **first**, before all other repos:

```bash
# From repo root
npm run build
# or from workspace root
node scripts/build.js  # builds in dependency order
```
