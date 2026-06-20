# ai-ticket-main-server — API Gateway (GraphQL)

Serves as the entry point for all client requests. Validates auth, enforces rate limits, and proxies to internal REST services.

## Base URL

```
http://localhost:4000
```

## Authentication

All mutations and queries (except `login` and `register`) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Obtain a token via the `login` mutation.

---

## REST Endpoint

### GET /health

Health check.

**Response `200`:**

```json
{
  "status": "ok",
  "service": "main-server",
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

---

## GraphQL Endpoint

```
POST /graphql
Content-Type: application/json
```

All GraphQL operations are sent as:

```json
{
  "query": "mutation|query { ... }",
  "variables": { ... }
}
```

---

### Query: `tickets`

List tickets with optional filters.

```graphql
query Tickets($status: String, $priority: String, $assignedTeam: String, $page: Int, $limit: Int) {
  tickets(status: $status, priority: $priority, assignedTeam: $assignedTeam, page: $page, limit: $limit) {
    id
    subject
    message
    status
    priority
    category
    confidence
    needsHumanReview
    suggestedReply
    createdAt
  }
}
```

**Variables:**

```json
{
  "status": "pending",
  "priority": "high",
  "limit": 20
}
```

**Response `200`:**

```json
{
  "data": {
    "tickets": [
      {
        "id": "clx...",
        "subject": "Cannot log in",
        "message": "I keep getting a 401 error...",
        "status": "pending",
        "priority": "high",
        "category": "technical",
        "confidence": 0.92,
        "needsHumanReview": false,
        "suggestedReply": "Thank you for reaching out...",
        "createdAt": "2026-06-05T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Query: `ticket`

Get a single ticket by ID.

```graphql
query Ticket($id: ID!) {
  ticket(id: $id) {
    id
    subject
    message
    status
    priority
    category
    assignedTeam
    assignedAgentId
    confidence
    needsHumanReview
    suggestedReply
    createdAt
  }
}
```

**Variables:**

```json
{ "id": "clx123abc" }
```

**Response `200`:**

```json
{
  "data": {
    "ticket": {
      "id": "clx123abc",
      "subject": "Cannot log in",
      "message": "I keep getting a 401 error...",
      "status": "pending",
      "priority": "high",
      "category": "technical",
      "assignedTeam": "technical-support",
      "assignedAgentId": null,
      "confidence": 0.92,
      "needsHumanReview": false,
      "suggestedReply": "Thank you for reaching out...",
      "createdAt": "2026-06-05T10:00:00.000Z"
    }
  }
}
```

---

### Mutation: `login`

Authenticate a user and receive a JWT token.

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      name
      email
      role
      teamId
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "email": "agent@example.com",
    "password": "securepassword"
  }
}
```

**Response `200`:**

```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": "usr_001",
        "name": "Alice Agent",
        "email": "agent@example.com",
        "role": "agent",
        "teamId": "team_001"
      }
    }
  }
}
```

**Error `401`:**

```json
{
  "errors": [{
    "message": "Invalid credentials",
    "extensions": { "code": "UNAUTHORIZED", "statusCode": 401 }
  }]
}
```

---

### Mutation: `register`

Register a new user.

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    id
    name
    email
    role
    teamId
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "Bob Agent",
    "email": "bob@example.com",
    "password": "securepassword",
    "role": "agent",
    "teamId": "team_001"
  }
}
```

**Response `200`:**

```json
{
  "data": {
    "register": {
      "id": "usr_002",
      "name": "Bob Agent",
      "email": "bob@example.com",
      "role": "agent",
      "teamId": "team_001"
    }
  }
}
```

---

### Mutation: `createTicket`

Create a new support ticket. Automatically enqueues a triage job.

```graphql
mutation CreateTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    id
    subject
    status
    priority
    createdAt
  }
}
```

**Variables:**

```json
{
  "input": {
    "subject": "Cannot log in",
    "message": "I keep getting a 401 error when trying to access the dashboard.",
    "customerId": "cus_001",
    "source": "web"
  }
}
```

**Response `201`:**

```json
{
  "data": {
    "createTicket": {
      "id": "clx123abc",
      "subject": "Cannot log in",
      "status": "pending",
      "priority": "medium",
      "createdAt": "2026-06-05T12:00:00.000Z"
    }
  }
}
```

---

### Mutation: `updateTicket`

Update an existing ticket's fields.

```graphql
mutation UpdateTicket($id: ID!, $input: UpdateTicketInput!) {
  updateTicket(id: $id, input: $input) {
    id
    status
    priority
    category
    assignedTeam
    needsHumanReview
  }
}
```

**Variables:**

```json
{
  "id": "clx123abc",
  "input": {
    "status": "assigned",
    "priority": "high",
    "assignedTeam": "technical-support"
  }
}
```

**Response `200`:**

```json
{
  "data": {
    "updateTicket": {
      "id": "clx123abc",
      "status": "assigned",
      "priority": "high",
      "category": null,
      "assignedTeam": "technical-support",
      "needsHumanReview": false
    }
  }
}
```

---

## Error Format

All errors follow a consistent structure:

```json
{
  "errors": [{
    "message": "Human-readable error message",
    "extensions": {
      "code": "ERROR_CODE",
      "statusCode": 400,
      "details": {}
    }
  }]
}
```

### Error Codes

| Code | Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `EXTERNAL_SERVICE_ERROR` | 502 | Downstream failure |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
