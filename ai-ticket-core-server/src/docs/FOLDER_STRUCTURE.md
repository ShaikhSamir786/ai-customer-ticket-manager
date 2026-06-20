# ai-ticket-core-server — Folder Structure

```
src/
├── index.ts                       # Entry point: Express server + route registration
├── config.ts                      # App configuration (port, service name)
├── logger.ts                      # Winston logger setup
│
├── boot/                          # Reserved: bootstrapping scripts
├── constants/                     # Reserved: app constants (error codes, etc.)
├── enums/                         # Reserved: shared enum definitions
├── functions/                     # Reserved: utility functions
├── types/                         # Reserved: shared TypeScript types
│
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts       # Global error handler (AppError → structured JSON)
│   ├── routes/                    # Reserved: centralized route registration
│   └── modules/
│       ├── tickets/
│       │   └── v1/
│       │       ├── controllers/   # Ticket CRUD + triage controller handlers
│       │       ├── routes.ts      # Ticket route definitions
│       │       └── services/      # Ticket business logic + BullMQ enqueue
│       ├── teams/
│       │   └── v1/
│       │       ├── controllers/   # Team CRUD controller handlers
│       │       ├── routes.ts      # Team route definitions
│       │       └── services/      # Team business logic
│       └── audit/
│           └── v1/
│               ├── controllers/   # Audit log controller handlers
│               ├── routes.ts      # Audit route definitions
│               └── services/      # Audit log query logic
│
└── docs/
    ├── API.md                     # REST API docs with examples
    └── FOLDER_STRUCTURE.md        # This file
```
