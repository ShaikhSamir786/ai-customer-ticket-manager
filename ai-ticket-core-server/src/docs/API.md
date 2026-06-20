# ai-ticket-core-server — Core Service (REST)

Internal REST API for ticket CRUD, team management, and audit logging.

## Base URL

```
http://localhost:3001
```

## Authentication

Internal services communicate without auth headers. In production, an internal API key or mTLS should be used.

---

## Tickets

### POST /v1/tickets

Create a new ticket. Enqueues a BullMQ triage job on success.

**Request Body:**

```json
{
  "customerId": "cus_001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "subject": "Cannot log in",
  "message": "I keep getting a 401 error when trying to access the dashboard.",
  "sourceChannel": "web",
  "customerTier": "premium",
  "createdByAgentId": "usr_001"
}
```

**Response `201`:**

```json
{
  "id": "clx123abc",
  "customerId": "cus_001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "subject": "Cannot log in",
  "message": "I keep getting a 401 error when trying to access the dashboard.",
  "status": "pending",
  "priority": "medium",
  "sourceChannel": "web",
  "customerTier": "premium",
  "createdByAgentId": "usr_001",
  "createdAt": "2026-06-05T12:00:00.000Z",
  "updatedAt": "2026-06-05T12:00:00.000Z"
}
```

**Error `400`:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "customerId, subject, and message are required",
    "details": {}
  }
}
```

---

### GET /v1/tickets

List tickets with optional filters.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status (pending, triaging, triaged, assigned, in_progress, waiting_customer, resolved, closed, escalated) |
| `priority` | string | Filter by priority (low, medium, high, critical) |
| `assignedTeamId` | string | Filter by team ID |
| `assignedAgentId` | string | Filter by agent ID |
| `limit` | number | Page size (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response `200`:**

```json
{
  "tickets": [
    {
      "id": "clx123abc",
      "customerId": "cus_001",
      "subject": "Cannot log in",
      "message": "I keep getting a 401 error...",
      "status": "pending",
      "priority": "medium",
      "assignedTeam": null,
      "assignedAgent": null,
      "messages": [],
      "createdAt": "2026-06-05T12:00:00.000Z",
      "updatedAt": "2026-06-05T12:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### GET /v1/tickets/:id

Get a single ticket with full relations.

**Response `200`:**

```json
{
  "id": "clx123abc",
  "customerId": "cus_001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "subject": "Cannot log in",
  "message": "I keep getting a 401 error...",
  "status": "triaged",
  "priority": "high",
  "category": "technical",
  "assignedTeam": {
    "id": "team_001",
    "name": "Technical Support"
  },
  "assignedAgent": {
    "id": "usr_002",
    "name": "Alice Agent",
    "email": "alice@example.com"
  },
  "confidence": 0.92,
  "needsHumanReview": false,
  "suggestedReply": "Thank you for reaching out...",
  "modelUsed": "gpt-4-turbo",
  "messages": [
    {
      "id": "msg_001",
      "content": "Please help!",
      "authorId": null,
      "isInternal": false,
      "createdAt": "2026-06-05T12:00:00.000Z"
    }
  ],
  "overrideHistory": [],
  "createdAt": "2026-06-05T12:00:00.000Z",
  "updatedAt": "2026-06-05T12:05:00.000Z"
}
```

**Error `404`:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource Ticket with id clx999 not found",
    "details": {}
  }
}
```

---

### PATCH /v1/tickets/:id

Update select fields on a ticket. Creates an audit log entry.

**Request Body:**

```json
{
  "status": "assigned",
  "priority": "high",
  "assignedTeamId": "team_001",
  "assignedAgentId": "usr_002",
  "needsHumanReview": false,
  "overrideReason": "Agent confirmed correct assignment",
  "updatedByAgentId": "usr_001"
}
```

**Allowed Fields:** `status`, `priority`, `category`, `assignedTeamId`, `assignedAgentId`, `needsHumanReview`, `overrideReason`

Setting `status` to `"resolved"` automatically sets `resolvedAt`.

**Response `200`:**

```json
{
  "id": "clx123abc",
  "status": "assigned",
  "priority": "high",
  "assignedTeamId": "team_001",
  "needsHumanReview": false,
  "updatedAt": "2026-06-05T12:10:00.000Z"
}
```

---

### POST /v1/tickets/update-triage

Update a ticket with AI triage results (called by processor-server).

**Request Body:**

```json
{
  "ticketId": "clx123abc",
  "category": "technical",
  "priority": "high",
  "sentiment": "frustrated",
  "assignedTeam": "technical-support",
  "confidence": 0.92,
  "needsHumanReview": false,
  "suggestedReply": "Thank you for reaching out... We have identified the issue...",
  "modelUsed": "gpt-4-turbo",
  "churnRisk": 0.35
}
```

**Behavior:** Sets `status` to `"triaged"` if `needsHumanReview` is true, otherwise `"assigned"`.

**Response `200`:**

```json
{
  "id": "clx123abc",
  "category": "technical",
  "priority": "high",
  "sentiment": "frustrated",
  "assignedTeamId": "technical-support",
  "confidence": 0.92,
  "needsHumanReview": false,
  "suggestedReply": "Thank you for reaching out...",
  "modelUsed": "gpt-4-turbo",
  "churnRisk": 0.35,
  "status": "assigned"
}
```

---

## Teams

### POST /v1/teams

Create a new team.

**Request Body:**

```json
{
  "name": "Technical Support",
  "description": "Handles technical issues and bugs",
  "skills": ["networking", "cloud", "api"],
  "maxCapacity": 20
}
```

**Response `201`:**

```json
{
  "id": "team_001",
  "name": "Technical Support",
  "description": "Handles technical issues and bugs",
  "skills": ["networking", "cloud", "api"],
  "maxCapacity": 20,
  "isActive": true,
  "createdAt": "2026-06-05T12:00:00.000Z",
  "updatedAt": "2026-06-05T12:00:00.000Z"
}
```

---

### GET /v1/teams

List all teams with member and ticket counts.

**Response `200`:**

```json
[
  {
    "id": "team_001",
    "name": "Technical Support",
    "description": "Handles technical issues and bugs",
    "skills": ["networking", "cloud", "api"],
    "maxCapacity": 20,
    "isActive": true,
    "memberCount": 5,
    "ticketCount": 12,
    "createdAt": "2026-06-05T12:00:00.000Z"
  }
]
```

---

### GET /v1/teams/:id

Get a single team with members and recent tickets.

**Response `200`:**

```json
{
  "id": "team_001",
  "name": "Technical Support",
  "members": [
    { "id": "usr_001", "name": "Alice Agent", "email": "alice@example.com", "role": "agent" }
  ],
  "tickets": [
    { "id": "clx123abc", "subject": "Cannot log in", "status": "pending", "createdAt": "2026-06-05T12:00:00.000Z" }
  ],
  "isActive": true,
  "createdAt": "2026-06-05T12:00:00.000Z"
}
```

**Error `404`:**

```json
{
  "error": { "code": "NOT_FOUND", "message": "Resource Team with id team_999 not found", "details": {} }
}
```

---

### PATCH /v1/teams/:id

Update team fields.

**Request Body:**

```json
{
  "name": "Advanced Technical Support",
  "maxCapacity": 30,
  "isActive": false
}
```

**Response `200`:**

```json
{
  "id": "team_001",
  "name": "Advanced Technical Support",
  "maxCapacity": 30,
  "isActive": false,
  "updatedAt": "2026-06-05T12:15:00.000Z"
}
```

---

## Audit Logs

### GET /v1/audit

List audit log entries.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `ticketId` | string | Filter by ticket |
| `userId` | string | Filter by user who performed the action |
| `action` | string | Filter by action name |
| `limit` | number | Page size (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response `200`:**

```json
{
  "logs": [
    {
      "id": "aud_001",
      "ticketId": "clx123abc",
      "userId": "usr_001",
      "action": "ticket.updated",
      "entity": "ticket",
      "entityId": "clx123abc",
      "metadata": {
        "changes": { "status": "assigned", "priority": "high" }
      },
      "user": {
        "id": "usr_001",
        "name": "Alice Agent",
        "email": "alice@example.com"
      },
      "createdAt": "2026-06-05T12:10:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### GET /health

Health check.

**Response `200`:**

```json
{
  "status": "ok",
  "service": "core-server",
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

---

## Error Format

All errors follow a consistent structure:

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
| `VALIDATION_ERROR` | 400 | Invalid request body/params |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
