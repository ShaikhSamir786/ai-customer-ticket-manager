# ai-ticket-llm-server — LLM Service (REST)

Provider-agnostic LLM abstraction layer. Routes requests to OpenAI, Anthropic, or Ollama with automatic fallback.

## Base URL

```
http://localhost:3003
```

## Authentication

Internal service — no auth enforced. In production, restrict to internal network or use an API key.

---

## Analyze

### POST /v1/analyze

Send a prompt to the LLM with default provider fallback (OpenAI → Anthropic → Ollama).

**Request Body:**

```json
{
  "prompt": "Classify this ticket as billing, technical, or account: 'I was charged twice for my subscription.'",
  "model": "gpt-4-turbo",
  "temperature": 0.2,
  "maxTokens": 500,
  "jsonMode": true
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | string | yes | — | The prompt text to send to the LLM |
| `model` | string | no | `gpt-4-turbo` | Override the model name |
| `temperature` | number | no | varies by provider | Sampling temperature (0–2) |
| `maxTokens` | number | no | varies by provider | Maximum output tokens |
| `jsonMode` | boolean | no | false | Request JSON-structured response |

**Response `200`:**

```json
{
  "content": "{\n  \"category\": \"billing\",\n  \"priority\": \"medium\",\n  \"confidence\": 0.95\n}",
  "model": "gpt-4-turbo",
  "provider": "openai",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 32,
    "totalTokens": 77
  }
}
```

**Error `400`:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "prompt is required",
    "details": {}
  }
}
```

---

### POST /v1/analyze/:provider

Send a prompt to a specific LLM provider. Bypasses the automatic fallback order.

**URL Parameters:**

| Param | Type | Description |
|---|---|---|
| `provider` | string | One of: `openai`, `anthropic`, `ollama` |

**Request Body:**

```json
{
  "prompt": "Summarize this support ticket in one sentence: 'I cannot access my account after the password reset.'",
  "model": "claude-3-opus-20240229",
  "temperature": 0.1,
  "maxTokens": 200,
  "jsonMode": false
}
```

**Response `200`:**

```json
{
  "content": "The customer is unable to access their account following a password reset.",
  "model": "claude-3-opus-20240229",
  "provider": "anthropic",
  "usage": {
    "promptTokens": 30,
    "completionTokens": 15,
    "totalTokens": 45
  }
}
```

**Error `400` — Invalid provider:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Provider invalid_provider not available. Available: openai, anthropic, ollama",
    "details": {}
  }
}
```

**Error `502` — All providers failed:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "All LLM providers failed",
    "details": {}
  }
}
```

---

## Prompt Templates

### GET /v1/prompts

List all prompt templates, ordered by creation date descending.

**Response `200`:**

```json
[
  {
    "id": "pt_001",
    "name": "triage-classification",
    "version": 3,
    "template": "Classify the following support ticket into one of these categories: billing, technical, account, product, legal, other.\n\nSubject: {{subject}}\nMessage: {{message}}\n\nCategory:",
    "variables": ["subject", "message"],
    "isActive": true,
    "createdBy": null,
    "metrics": null,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-03T14:00:00.000Z"
  }
]
```

---

### POST /v1/prompts

Create a new version of a prompt template. Auto-increments the version number if a template with the same name exists.

**Request Body:**

```json
{
  "name": "triage-classification",
  "template": "Classify the following support ticket into one of these categories: billing, technical, account, product, legal, other.\n\nSubject: {{subject}}\nMessage: {{message}}\n\nCategory:",
  "variables": ["subject", "message"],
  "isActive": false
}
```

**Response `201`:**

```json
{
  "id": "pt_004",
  "name": "triage-classification",
  "version": 4,
  "template": "Classify the following support ticket into one of these categories: billing, technical, account, product, legal, other.\n\nSubject: {{subject}}\nMessage: {{message}}\n\nCategory:",
  "variables": ["subject", "message"],
  "isActive": false,
  "createdBy": null,
  "metrics": null,
  "createdAt": "2026-06-05T12:00:00.000Z",
  "updatedAt": "2026-06-05T12:00:00.000Z"
}
```

**Error `400`:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name and template are required",
    "details": {}
  }
}
```

---

### GET /health

Health check.

**Response `200`:**

```json
{
  "status": "ok",
  "service": "llm-server",
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

---

## Provider Fallback Chain

If a provider fails (timeout, rate limit, auth error), the router automatically falls through:

```
openai  →  anthropic  →  ollama
```

If all three fail, a `502` error is returned. Providers are skipped if their API key is not configured in the environment.

---

## Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  }
}
```

### Error Codes

| Code | Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `INTERNAL_ERROR` | 500 | All providers failed |
