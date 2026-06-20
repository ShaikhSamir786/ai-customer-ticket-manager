# ai-ticket-shared-lib — Folder Structure

```
src/
├── index.ts                       # Entry point: re-exports all modules
│
├── config/
│   └── index.ts                   # AppConfig interface + loadConfig() from env
│
├── decorators/                    # Reserved: NestJS-style decorators
│
├── errors/
│   └── index.ts                   # AppError class hierarchy (NotFound, Validation, Unauthorized, etc.)
│
├── logger/
│   └── index.ts                   # Winston logger factory (structured JSON, correlation IDs)
│
├── queue/
│   └── index.ts                   # BullMQ queue constants (DEFAULT_JOB_OPTIONS)
│
├── types/                         # Reserved: shared TypeScript types/interfaces
│
└── docs/
    └── FOLDER_STRUCTURE.md        # This file
```
