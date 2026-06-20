# ai-ticket-main-server — Folder Structure

```
src/
├── index.ts                       # Entry point: Express + Apollo Server v5 (executeHTTPGraphQLRequest)
├── config.ts                      # App configuration (port, URLs, JWT secrets)
├── logger.ts                      # Winston logger setup
│
├── boot/                          # Reserved: bootstrapping scripts
│
├── graphql/
│   ├── context.ts                 # GraphQL context factory (JWT auth extraction)
│   └── modules/
│       ├── base.graphql           # Root Query & Mutation declarations (for extend type)
│       ├── helpers.ts             # requireAuth, formatAppError shared utils
│       ├── index.ts               # Combines all typeDefs (reads .graphql files) + resolvers
│       ├── user/
│       │   ├── user.graphql       # User, AuthPayload types + login/register mutations
│       │   ├── mutation/
│       │   │   └── index.ts       # login, register resolvers
│       │   ├── query/
│       │   │   └── index.ts       # User-related queries (placeholder)
│       │   └── services/          # Module-specific services (placeholder)
│       └── ticket/
│           ├── ticket.graphql     # Ticket type + tickets/ticket queries + mutations
│           ├── mutation/
│           │   └── index.ts       # createTicket, updateTicket resolvers
│           ├── query/
│           │   └── index.ts       # tickets, ticket resolvers
│           └── services/          # Module-specific services (placeholder)
│
├── rest/
│   ├── middlewares/
│   │   └── auth.ts                # JWT auth middleware + role guard (AuthPayload type)
│   └── modules/
│       ├── auth/
│       │   └── v1/
│       │       └── services/      # Login + register (bcrypt, JWT, proxy to core-server REST)
│       └── tickets/
│           └── v1/
│               └── services/      # Proxy services (axios to core-server REST)
│
└── docs/
    ├── API.md                     # GraphQL schema docs with examples
    └── FOLDER_STRUCTURE.md        # This file
```
