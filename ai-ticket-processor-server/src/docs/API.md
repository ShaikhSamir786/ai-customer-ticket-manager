# ai-ticket-processor-server — AI Processor (REST)

Orchestrates AI-powered ticket triage: classification, priority assignment, sentiment analysis, team routing, and reply generation.

## Base URL

```
http://localhost:3002
```

## Authentication

Internal service — no auth enforced. In production, restrict to internal network.

---

## Triage

### POST /v1/triage/process

Process a single ticket through the AI triage pipeline.

**Flow:**
1. Fetches ticket from `core-server` via `GET /v1/tickets/:ticketId`
2. Constructs a structured prompt with ticket details
3. Sends prompt to `llm-server` via `POST /v1/analyze`
4. Parses the LLM JSON response
5. Falls back to keyword-based rules engine if LLM is unavailable
6. Saves triage result to `core-server` via `POST /v1/tickets/update-triage`

**Request Body:**

```json
{
  "ticketId": "clx123abc"
}
```

**Response `200`:**

```json
{
  "ticketId": "clx123abc",
  "category": "technical",
  "priority": "high",
  "sentiment": "frustrated",
  "assignedTeam": "technical-support",
  "confidence": 0.92,
  "needsHumanReview": false,
  "suggestedReply": "Thank you for reaching out to us regarding \"Cannot log in\". Our technical support team has been notified and will investigate the 401 error you're experiencing. We'll get back to you shortly with a resolution.",
  "modelUsed": "gpt-4-turbo",
  "churnRisk": 0.35,
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

**Error `400`:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ticketId is required",
    "details": {}
  }
}
```

**Error `502` — Core server unavailable:**

```json
{
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "core-server: Failed to fetch ticket clx123abc",
    "details": {}
  }
}
```

---

### POST /v1/triage/batch

Process multiple tickets in parallel.

**Request Body:**

```json
{
  "ticketIds": ["clx001", "clx002", "clx003"]
}
```

**Response `200`:**

```json
[
  {
    "ticketId": "clx001",
    "category": "billing",
    "priority": "critical",
    "confidence": 0.88,
    "needsHumanReview": false,
    "assignedTeam": "finance-support",
    "suggestedReply": "...",
    "modelUsed": "gpt-4-turbo",
    "timestamp": "2026-06-05T12:00:00.000Z"
  },
  {
    "ticketId": "clx002",
    "category": "technical",
    "priority": "high",
    "confidence": 0.75,
    "needsHumanReview": false,
    "assignedTeam": "technical-support",
    "suggestedReply": "...",
    "modelUsed": "gpt-4-turbo",
    "timestamp": "2026-06-05T12:00:01.000Z"
  },
  {
    "ticketId": "clx003",
    "category": "account",
    "priority": "medium",
    "confidence": 0.65,
    "needsHumanReview": true,
    "assignedTeam": "account-management",
    "suggestedReply": "...",
    "modelUsed": "gpt-4-turbo",
    "timestamp": "2026-06-05T12:00:02.000Z"
  }
]
```

**Error `400`:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ticketIds array is required",
    "details": {}
  }
}
```

---

## Triage Output Fields

| Field | Type | Description |
|---|---|---|
| `ticketId` | string | Processed ticket ID |
| `category` | string | `billing`, `technical`, `account`, `product`, `legal`, `other` |
| `priority` | string | `low`, `medium`, `high`, `critical` |
| `sentiment` | string | `frustrated`, `neutral`, `satisfied`, `angry`, `confused` |
| `assignedTeam` | string | `technical-support`, `finance-support`, `account-management`, `product-support` |
| `confidence` | number | 0–1 score of triage confidence |
| `needsHumanReview` | boolean | True if confidence < 0.7 or legal/financial/security keywords detected |
| `suggestedReply` | string | Draft reply to the customer |
| `modelUsed` | string | LLM model used (or `"rules-fallback"` for keyword engine) |
| `churnRisk` | number | 0–1 predicted churn likelihood |
| `timestamp` | string | ISO 8601 timestamp of processing |

---

## Rules-Based Fallback

When the LLM is unavailable, the processor applies a keyword-based rules engine:

| Signal | Category | Priority | Sentiment |
|---|---|---|---|
| `charg`, `pay`, `bill`, `refund`, `$` | `billing` | — | — |
| `error`, `bug`, `crash`, `fail`, `api`, `login` | `technical` | — | — |
| `account`, `profile`, `upgrade`, `setting` | `account` | — | — |
| `urgent`, `asap`, `critical`, `outage` | — | `critical` | — |
| `frustrat`, `angry`, `terrible` | — | `high` | `frustrated` |
| `thank`, `appreciate`, `pleased` | — | — | `satisfied` |

Fallback confidence is always `0.6`, and `needsHumanReview` is always `true`.

---

### GET /health

Health check.

**Response `200`:**

```json
{
  "status": "ok",
  "service": "processor-server",
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

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
| `EXTERNAL_SERVICE_ERROR` | 502 | Core/LLM service failure |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
