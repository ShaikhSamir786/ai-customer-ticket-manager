# ai-ticket-processor-server — Folder Structure

```
src/
├── index.ts                       # Entry point: Express server + route registration
├── config.ts                      # App configuration (port, service name, service URLs)
├── logger.ts                      # Winston logger setup
│
├── agents/                        # Reserved: multi-agent orchestration modules
│
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts       # Global error handler (AppError → structured JSON)
│   ├── routes/                    # Reserved: centralized route registration
│   └── modules/
│       └── triage/
│           └── v1/
│               ├── controllers/   # Triage controller handlers
│               ├── routes.ts      # Triage route definitions (process, batch)
│               └── services/      # Triage orchestration + rules-based fallback
│
└── docs/
    ├── API.md                     # REST API docs with examples
    └── FOLDER_STRUCTURE.md        # This file
```
