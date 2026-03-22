# API Examples

Practical curl examples for every endpoint. All examples assume:

- Base URL: `http://localhost:3001`
- IM header: `Information-Mediator-Client: ET/GOV/10000001/REGISTRATION`
- Auth token obtained from `/api/v1/auth/me` after login flow

Set these environment variables before running examples:

```bash
export BASE="http://localhost:3001/api/v1"
export IM="Information-Mediator-Client: ET/GOV/10000001/REGISTRATION"
export TOKEN="Bearer <your-jwt-token>"
```

---

## Authentication

### Start login (redirects to mock-Fayda)

```bash
curl -v "$BASE/auth/login"
# HTTP 302 → Location: http://localhost:4011/authorize?...
```

### Get current user profile

```bash
curl -s "$BASE/auth/me" \
  -H "Authorization: $TOKEN" \
  | jq .
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "faydaId": "ET-2024-0001-PSUT",
  "fullName": "Dawit Haile Tesfaye",
  "email": "dawit.haile@example.et",
  "roles": ["applicant"],
  "createdAt": "2024-01-15T08:30:00.000Z"
}
```

---

## Health

### Liveness probe

```bash
curl -s "$BASE/health" | jq .
```

```json
{ "status": "ok", "timestamp": "2024-01-15T08:30:00.000Z" }
```

### Readiness probe (checks DB + Redis)

```bash
curl -s "$BASE/ready" | jq .
```

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok"
  },
  "timestamp": "2024-01-15T08:30:00.000Z"
}
```

---

## Services

### List all active services

```bash
curl -s "$BASE/services" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq .
```

```json
{
  "data": [
    {
      "id": "...",
      "code": "business-registration",
      "name": "Business Registration",
      "nameAm": "የንግድ ምዝገባ",
      "description": "Register a new business entity...",
      "estimatedDays": 5,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "code": "trade-license-renewal",
      "name": "Trade License Renewal",
      "nameAm": "የንግድ ፈቃድ ታደሳ"
    },
    {
      "code": "manufacturing-permit",
      "name": "Manufacturing Permit",
      "nameAm": "የማምረቻ ፈቃድ"
    }
  ],
  "total": 3
}
```

### Get eForm schema for a service

```bash
curl -s "$BASE/services/business-registration/eform" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq .fields[0:3]
```

```json
[
  {
    "key": "entity_type",
    "type": "select",
    "label": "Entity Type",
    "labelAm": "የድርጅቱ አይነት",
    "required": true,
    "options": ["PLC", "SC", "OPPLC", "SOLE_TRADER", "PARTNERSHIP"]
  },
  {
    "key": "company_name",
    "type": "text",
    "label": "Proposed Company Name",
    "labelAm": "የሚፈለገው የኩባንያ ስም",
    "required": true
  },
  {
    "key": "capital",
    "type": "number",
    "label": "Registered Capital (ETB)",
    "labelAm": "ምዝገባ ካፒታል (ብር)",
    "required": true
  }
]
```

---

## Applications

### Submit a new business registration application

```bash
curl -s -X POST "$BASE/applications" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCode": "business-registration",
    "formData": {
      "entity_type": "PLC",
      "company_name": "Addis Tech Solutions PLC",
      "capital": 50000,
      "shareholders": [
        { "name": "Dawit Haile Tesfaye", "percentage": 60 },
        { "name": "Mekdes Alemu Worku", "percentage": 40 }
      ],
      "registered_address": {
        "region": "Addis Ababa",
        "subcity": "Bole",
        "woreda": "03",
        "kebele": "02"
      },
      "business_activity": "Software development and IT consulting",
      "esic_code": "J6201"
    }
  }' | jq .
```

```json
{
  "id": "app-uuid-here",
  "referenceNumber": "REG-2024-000001",
  "serviceCode": "business-registration",
  "status": "DRAFT",
  "applicantId": "user-uuid",
  "formData": { "...": "..." },
  "calculatedFees": [
    { "type": "registration", "amount": 500, "currency": "ETB" }
  ],
  "createdAt": "2024-01-15T09:00:00.000Z"
}
```

### Submit (move from DRAFT → SUBMITTED)

```bash
APP_ID="app-uuid-here"

curl -s -X POST "$BASE/applications/$APP_ID/submit" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq .status
```

```
"SUBMITTED"
```

### Get application status

```bash
curl -s "$BASE/applications/$APP_ID" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq '{status, referenceNumber, currentTask}'
```

```json
{
  "status": "UNDER_REVIEW",
  "referenceNumber": "REG-2024-000001",
  "currentTask": {
    "stepCode": "name-review",
    "assignedRole": "name-reviewer",
    "dueAt": "2024-01-17T09:00:00.000Z"
  }
}
```

### List my applications

```bash
curl -s "$BASE/applications?page=1&limit=10" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq '{total: .total, count: (.data | length)}'
```

### Submit a trade license renewal

```bash
curl -s -X POST "$BASE/applications" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCode": "trade-license-renewal",
    "formData": {
      "license_number": "TL-AA-2023-001234",
      "business_name": "Haile General Trading",
      "address_changed": false,
      "annual_revenue": 450000,
      "employee_count": 8,
      "renewal_year": 2024
    }
  }' | jq '{id, referenceNumber, status}'
```

### Submit a manufacturing permit application

```bash
curl -s -X POST "$BASE/applications" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceCode": "manufacturing-permit",
    "formData": {
      "facility_name": "Tigist Food Processing Factory",
      "sector": "food_processing",
      "esia_category": "B",
      "production_capacity_tonnes_per_year": 500,
      "employee_count": 45,
      "uses_water_source": false,
      "uses_hazardous_materials": false,
      "location": {
        "region": "Oromia",
        "city": "Adama",
        "zone": "East Shewa"
      }
    }
  }' | jq '{id, referenceNumber, calculatedFees}'
```

---

## Documents

### Upload a document for an application

```bash
curl -s -X POST "$BASE/documents" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  -F "applicationId=$APP_ID" \
  -F "documentType=memorandum_of_association" \
  -F "file=@/path/to/memorandum.pdf" \
  | jq .
```

```json
{
  "id": "doc-uuid",
  "applicationId": "app-uuid",
  "documentType": "memorandum_of_association",
  "fileName": "memorandum.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 245760,
  "uploadedAt": "2024-01-15T09:05:00.000Z"
}
```

---

## Tasks (Back-office)

### List pending tasks for an operator

```bash
curl -s "$BASE/tasks?status=PENDING&role=name-reviewer" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq '.data[] | {id, applicationId, stepCode, dueAt}'
```

### Complete a task (approve)

```bash
TASK_ID="task-uuid-here"

curl -s -X POST "$BASE/tasks/$TASK_ID/complete" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "notes": "Company name is unique and compliant with Commercial Code Art. 221"
  }' | jq .
```

```json
{
  "taskId": "task-uuid",
  "decision": "APPROVED",
  "nextTask": {
    "id": "next-task-uuid",
    "stepCode": "document-verification",
    "assignedRole": "document-verifier"
  },
  "applicationStatus": "UNDER_REVIEW"
}
```

### Send application back to applicant (request more info)

```bash
curl -s -X POST "$BASE/tasks/$TASK_ID/complete" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "SENT_BACK",
    "notes": "Please provide a notarised copy of the Memorandum of Association"
  }' | jq '{applicationStatus: .applicationStatus}'
```

```json
{ "applicationStatus": "RETURNED" }
```

---

## Statistics

### Service-level statistics

```bash
curl -s "$BASE/statistics" \
  -H "$IM" \
  -H "Authorization: $TOKEN" \
  | jq .
```

```json
{
  "totalApplications": 156,
  "byStatus": {
    "DRAFT": 12,
    "SUBMITTED": 8,
    "UNDER_REVIEW": 34,
    "APPROVED": 89,
    "REJECTED": 11,
    "RETURNED": 2
  },
  "byService": {
    "business-registration": 67,
    "trade-license-renewal": 58,
    "manufacturing-permit": 31
  },
  "averageProcessingDays": {
    "business-registration": 4.2,
    "trade-license-renewal": 2.8,
    "manufacturing-permit": 12.1
  },
  "generatedAt": "2024-01-15T12:00:00.000Z"
}
```

---

## Error Responses

All errors follow the GovStack CFR error format:

```json
{
  "code": "BB-REG-4000",
  "message": "Human-readable description",
  "correlationId": "uuid-v4",
  "timestamp": "ISO-8601",
  "details": { "optional": "extra context" }
}
```

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | BB-REG-4000 | Bad request / validation failure |
| 400 | BB-REG-4202 | Missing or malformed IM header |
| 401 | BB-REG-4001 | Missing or invalid JWT |
| 403 | BB-REG-4003 | Insufficient role |
| 404 | BB-REG-4004 | Resource not found |
| 409 | BB-REG-4009 | Conflict (duplicate) |
| 422 | BB-REG-4022 | Unprocessable (business rule violation) |
| 422 | BB-REG-4100 | Invalid workflow transition |
| 422 | BB-REG-4101 | Invalid form data |
| 429 | BB-REG-4029 | Rate limit exceeded |
| 500 | BB-REG-5000 | Internal server error |
