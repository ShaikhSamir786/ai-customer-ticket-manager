# ai-ticket-shared-schema — Folder Structure

```
src/
├── index.ts                       # Entry point: Sequelize init, model registration, exports
│
├── config/
│   └── index.ts                   # Sequelize connection config (pool, dialect, env vars)
│
├── enums.ts                       # Shared enums (TicketStatus, TicketPriority, TicketCategory, UserRole)
│
├── models/
│   ├── index.ts                   # Barrel export for all models
│   ├── Team.ts                    # Team model
│   ├── User.ts                    # User model (belongs to Team)
│   ├── Ticket.ts                  # Ticket model (belongs to Team + User)
│   ├── TicketMessage.ts           # Ticket message model (belongs to Ticket + User)
│   ├── OverrideHistory.ts         # Override history model (belongs to Ticket + User)
│   ├── AuditLog.ts                # Audit log model (belongs to Ticket + User)
│   ├── SLAPolicy.ts               # SLA policy model (standalone)
│   ├── PromptTemplate.ts          # Prompt template model (standalone)
│   └── WebhookSubscription.ts     # Webhook subscription model (standalone)
│
├── migrations/
│   └── index.ts                   # Auto-migration: sync models to database
│
├── seeders/
│   └── index.ts                   # Seeders: default SLA policies + prompt templates
│
└── docs/
    └── FOLDER_STRUCTURE.md        # This file
```
