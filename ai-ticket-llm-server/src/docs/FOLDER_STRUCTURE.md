# ai-ticket-llm-server — Folder Structure

```
src/
├── index.ts                       # Entry point: Express server + route registration
├── config.ts                      # App configuration (port, service name)
├── logger.ts                      # Winston logger setup
│
├── providers/
│   ├── types.ts                   # LLM provider interfaces (LLMProvider, LLMResponse, ProviderType)
│   ├── router.ts                  # LLMRouter — fallback chain (OpenAI → Anthropic → Ollama)
│   ├── openai-provider.ts         # OpenAI API integration
│   ├── anthropic-provider.ts      # Anthropic API integration
│   └── ollama-provider.ts         # Ollama local provider integration
│
├── rest/
│   ├── middlewares/
│   │   └── error-handler.ts       # Global error handler (AppError → structured JSON)
│   ├── routes/                    # Reserved: centralized route registration
│   └── modules/
│       ├── analyze/
│       │   └── v1/
│       │       ├── controllers/   # Analyze controller handlers
│       │       ├── routes.ts      # Analyze route definitions
│       │       └── services/      # LLM prompt analysis logic
│       └── prompts/
│           └── v1/
│               ├── controllers/   # Prompt template CRUD controllers
│               ├── routes.ts      # Prompt route definitions
│               └── services/      # Prompt template business logic
│
└── docs/
    ├── API.md                     # REST API docs with examples
    └── FOLDER_STRUCTURE.md        # This file
```
