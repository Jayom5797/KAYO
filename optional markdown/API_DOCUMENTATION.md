# KAYO API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:8000` (development)  
**Authentication**: JWT Bearer Token

---

## Authentication

### POST /api/auth/login
Login with email and password.

**Request**:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=analyst@security-team.com&password=SecurePass123!"
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

### POST /api/auth/register
Register new user with invitation token.

**Request**:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@security-team.com",
    "password": "SecurePass123!",
    "invitation_token": "abc123def456"
  }'
```

**Response**:
```json
{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "analyst@security-team.com",
  "role": "member",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Incidents

### GET /api/incidents
List security incidents.

**Request**:
```bash
curl -X GET "http://localhost:8000/api/incidents?severity=critical&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Query Parameters**:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Results per page (default: 100)
- `severity` (string): Filter by severity (critical, high, medium, low)
- `status_filter` (string): Filter by status (open, investigating, resolved)

**Response**:
```json
[
  {
    "incident_id": "770e8400-e29b-41d4-a716-446655440002",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Suspicious privilege escalation detected",
    "description": "Container process attempted to escalate privileges",
    "severity": "critical",
    "status": "open",
    "detected_at": "2026-03-12T14:30:00Z",
    "mitre_tactics": ["TA0004"],
    "mitre_techniques": ["T1068"],
    "affected_entities": [
      {"type": "Container", "id": "payments-api-7d9f8"}
    ]
  }
]
```

### GET /api/incidents/{incident_id}
Get incident details.

**Request**:
```bash
curl -X GET http://localhost:8000/api/incidents/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PATCH /api/incidents/{incident_id}
Update incident status.

**Request**:
```bash
curl -X PATCH http://localhost:8000/api/incidents/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "notes": [
      {"text": "False positive - authorized maintenance", "timestamp": "2026-03-12T15:00:00Z"}
    ]
  }'
```

### GET /api/incidents/{incident_id}/attack-path
Get attack path reconstruction.

**Request**:
```bash
curl -X GET http://localhost:8000/api/incidents/770e8400-e29b-41d4-a716-446655440002/attack-path \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "root_cause": [
    {"type": "Process", "id": "malicious-script-pid-1234"}
  ],
  "attack_chain": [
    {
      "step": 1,
      "from_entity": "malicious-script-pid-1234",
      "to_entity": "sensitive-file-etc-passwd",
      "relationship_type": "READ",
      "timestamp": "2026-03-12T14:25:00Z"
    }
  ],
  "timeline": [
    {
      "timestamp": "2026-03-12T14:25:00Z",
      "description": "Process accessed sensitive file",
      "entities": ["malicious-script-pid-1234", "sensitive-file-etc-passwd"]
    }
  ],
  "confidence_score": 0.92,
  "affected_entities": [
    {"type": "Process", "id": "malicious-script-pid-1234"},
    {"type": "File", "id": "sensitive-file-etc-passwd"}
  ]
}
```

---

## Deployments

### POST /api/deployments
Create new deployment.

**Request**:
```bash
curl -X POST http://localhost:8000/api/deployments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "payments-api",
    "git_repo": "https://github.com/company/payments-api",
    "git_branch": "main",
    "env_vars": {
      "DATABASE_URL": "postgresql://...",
      "API_KEY": "secret123"
    }
  }'
```

**Response**:
```json
{
  "deployment_id": "880e8400-e29b-41d4-a716-446655440003",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "app_name": "payments-api",
  "git_repo": "https://github.com/company/payments-api",
  "git_branch": "main",
  "status": "pending",
  "created_at": "2026-03-12T16:00:00Z"
}
```

### GET /api/deployments
List deployments.

**Request**:
```bash
curl -X GET "http://localhost:8000/api/deployments?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/deployments/{deployment_id}
Get deployment details.

**Request**:
```bash
curl -X GET http://localhost:8000/api/deployments/880e8400-e29b-41d4-a716-446655440003 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Invitations

### POST /api/invitations
Create team member invitation.

**Request**:
```bash
curl -X POST http://localhost:8000/api/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@security-team.com",
    "role": "member"
  }'
```

**Response**:
```json
{
  "invitation_id": "990e8400-e29b-41d4-a716-446655440004",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newmember@security-team.com",
  "role": "member",
  "status": "pending",
  "created_at": "2026-03-12T17:00:00Z",
  "expires_at": "2026-03-19T17:00:00Z",
  "invitation_link": "https://app.kayo.io/register?token=abc123def456"
}
```

### GET /api/invitations
List invitations.

**Request**:
```bash
curl -X GET "http://localhost:8000/api/invitations?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### DELETE /api/invitations/{invitation_id}
Revoke invitation.

**Request**:
```bash
curl -X DELETE http://localhost:8000/api/invitations/990e8400-e29b-41d4-a716-446655440004 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Webhooks

### POST /api/webhooks
Create webhook.

**Request**:
```bash
curl -X POST http://localhost:8000/api/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Incident Alerts",
    "url": "https://hooks.slack.com/services/T00/B00/XXX",
    "event_types": ["incident.created", "incident.updated"],
    "description": "Send critical incidents to #security-alerts"
  }'
```

**Response**:
```json
{
  "webhook_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Slack Incident Alerts",
  "url": "https://hooks.slack.com/services/T00/B00/XXX",
  "event_types": ["incident.created", "incident.updated"],
  "is_active": true,
  "created_at": "2026-03-12T18:00:00Z"
}
```

### GET /api/webhooks
List webhooks.

**Request**:
```bash
curl -X GET http://localhost:8000/api/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/webhooks/{webhook_id}/deliveries
List webhook delivery logs.

**Request**:
```bash
curl -X GET http://localhost:8000/api/webhooks/aa0e8400-e29b-41d4-a716-446655440005/deliveries \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
[
  {
    "delivery_id": "bb0e8400-e29b-41d4-a716-446655440006",
    "webhook_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "event_type": "incident.created",
    "status": "delivered",
    "status_code": 200,
    "attempts": 1,
    "created_at": "2026-03-12T18:30:00Z",
    "delivered_at": "2026-03-12T18:30:01Z"
  }
]
```

---

## Webhook Payload Format

All webhook deliveries include:

**Headers**:
- `Content-Type: application/json`
- `X-Webhook-Signature: sha256=abc123...` (HMAC-SHA256)
- `X-Webhook-Event: incident.created`
- `X-Webhook-Delivery: bb0e8400-e29b-41d4-a716-446655440006`
- `User-Agent: KAYO-Webhook/1.0`

**Payload**:
```json
{
  "event_type": "incident.created",
  "timestamp": "2026-03-12T18:30:00Z",
  "delivery_id": "bb0e8400-e29b-41d4-a716-446655440006",
  "data": {
    "incident_id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Suspicious privilege escalation detected",
    "severity": "critical",
    "status": "open",
    "detected_at": "2026-03-12T14:30:00Z"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Status Codes**:
- `400` Bad Request - Invalid input
- `401` Unauthorized - Missing or invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource doesn't exist
- `409` Conflict - Resource already exists
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

---

## Rate Limiting

Rate limits per tenant tier:
- **Free**: 100 requests/minute
- **Pro**: 1000 requests/minute
- **Enterprise**: 10000 requests/minute

**Headers**:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Pagination

List endpoints support pagination:

**Parameters**:
- `skip`: Number of records to skip (default: 0)
- `limit`: Number of records to return (default: 100, max: 1000)

**Example**:
```bash
curl -X GET "http://localhost:8000/api/incidents?skip=100&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
