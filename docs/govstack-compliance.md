# GovStack Compliance Mapping

Requirement-by-requirement mapping of the GovStack Registration Building Block specification to this implementation.

---

## Cross-Functional Requirements (CFR)

### CFR 5.1 — Security

| Control | Implementation |
|---------|----------------|
| Authentication | Fayda/eSignet OIDC with PKCE (`src/integrations/fayda/`) |
| Authorization | Role-based access via JWT claims (`src/integrations/fayda/middleware.ts`) |
| Rate limiting | `@fastify/rate-limit` plugin (`src/plugins/rate-limit.ts`) |
| CORS | `@fastify/cors` plugin (`src/plugins/cors.ts`) |
| Input validation | Zod schemas on all request bodies (`src/modules/*/schema.ts`) |
| IM header validation | Format + registered client check (`src/plugins/information-mediator.ts`) |

### CFR 5.1.2 — Immutable Audit Trail

Every state-changing operation is recorded in the `AuditLog` table.

- **Model**: `prisma/schema.prisma` -> `AuditLog`
- **Writer**: `src/common/audit.ts` -> `AuditLogger.record()`
- **Fields**: `id`, `action`, `resource`, `resourceId`, `actorId`, `oldValue` (JSON), `newValue` (JSON), `timestamp`
- **Immutability**: No UPDATE or DELETE operations defined on audit records

### CFR 5.2 — Information Mediator

All non-health API requests must include the `Information-Mediator-Client` header.

- **Plugin**: `src/plugins/information-mediator.ts`
- **Format**: `{INSTANCE}/{CLASS}/{MEMBER}/{SUBSYSTEM}` (e.g., `ET/GOV/10000001/REGISTRATION`)
- **Validation**: Regex format check + optional registered client validation (`IM_VALIDATE_CLIENTS=true`)
- **Exempt paths**: `/api/v1/health`, `/api/v1/ready`, `/docs`, `/api/v1/auth/*`
- **Type definitions**: `src/integrations/information-mediator/types.ts`

### CFR 5.3 — Correlation IDs

Every request is assigned or propagates a correlation ID.

- **Plugin**: `src/common/correlation.ts`
- **Header**: `X-Correlation-Id`
- **Behavior**: If provided by caller, propagated unchanged. If absent, a new UUID v4 is generated.
- **Response**: Always included in response headers and error bodies.

### CFR 5.4 — Structured Logging

All logs are emitted as structured JSON.

- **Logger**: `src/common/logger.ts` (Pino)
- **Fields**: `level`, `time`, `msg`, `correlationId`, `req.method`, `req.url`, `req.remoteAddress`
- **Request serializer**: Custom serializer in `src/index.ts` strips sensitive headers

### CFR 5.5 — Privacy and PII Protection

- **Fayda PSUT**: Pairwise Subject Tokens prevent raw national ID (FIN) storage
- **Encryption**: AES-256-GCM for PII fields (config: `ENCRYPTION_KEY`)
- **Log redaction**: Request serializer excludes authorization headers and body content
- **Data minimisation**: Only essential identity claims stored in `User` model

### CFR 5.6 — Fail-Fast Configuration Validation

- **Implementation**: `src/config/index.ts`
- **Mechanism**: Zod schema validates all environment variables at startup
- **Behavior**: Application refuses to start if required variables are missing or malformed
- **Error output**: Human-readable validation error with field names and messages

### CFR 5.7 — Health and Readiness Probes

- **Health**: `GET /api/v1/health` — returns `200` if process is alive
- **Readiness**: `GET /api/v1/ready` — checks PostgreSQL connectivity (`SELECT 1`) and Redis ping
- **Implementation**: `src/modules/health/health.routes.ts`
- **No auth required**: Both endpoints are exempt from JWT and IM header validation

### CFR 5.8 — OpenAPI Documentation

- **Swagger UI**: Available at `/docs` (via `@fastify/swagger-ui`)
- **Machine-readable**: JSON spec at `/docs/json`
- **Plugin**: `src/plugins/swagger.ts`
- **Auto-generated**: Route schemas are derived from Zod definitions

---

## Registration BB Functional Requirements

### Reg BB 3.1 — Service Catalogue

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/services` | List all active registration services |
| `GET /api/v1/services/:code` | Get service details by code |
| `GET /api/v1/services/:code/eform` | Get the eForm (dynamic form schema) for a service |

- **Models**: `Service`, `EForm`, `WorkflowStep`, `Fee` in `prisma/schema.prisma`
- **Module**: `src/modules/services/`
- **Seed data**: 3 Ethiopian services with bilingual labels (`prisma/seed.ts`)

### Reg BB 3.2 — Application Lifecycle

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/applications` | Create a new application |
| `GET /api/v1/applications/:id` | Get application details |
| `GET /api/v1/applications` | List applications (filtered by user/status) |
| `POST /api/v1/applications/:id/submit` | Submit a draft application |

**State machine**:

```
DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED
                                   -> REJECTED
                   -> RETURNED (sent back to applicant)
                   -> WITHDRAWN (by applicant)
```

- **Models**: `Application`, `ApplicationStatusHistory` in `prisma/schema.prisma`
- **Module**: `src/modules/applications/`
- **Workflow engine**: `src/workflows/engine.ts` evaluates determinants on submission

### Reg BB 3.3 — Workflow Tasks

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/tasks` | List tasks (filtered by role/status) |
| `GET /api/v1/tasks/:id` | Get task details |
| `POST /api/v1/tasks/:id/complete` | Complete a task (approve/reject/send back) |

- **Model**: `Task` in `prisma/schema.prisma`
- **Workflow steps**: Defined per service in `WorkflowStep` model
- **Operator roles**: `name-reviewer`, `document-verifier`, `registration-officer`, `compliance-checker`, `license-officer`, `technical-assessor`, `environmental-officer`, `permit-authority`
- **Module**: `src/modules/tasks/`

### Reg BB 3.4 — Document Management

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/documents` | Upload a document (multipart) |
| `GET /api/v1/documents/:id` | Download a document |

- **Model**: `ApplicationDocument` in `prisma/schema.prisma`
- **Storage**: Local filesystem (`uploads/` directory), configurable via `UPLOAD_DIR`
- **Size limit**: Configurable via `MAX_FILE_SIZE_MB` (default: 10 MB)
- **Module**: `src/modules/documents/`

### Reg BB 3.5 — Fee Integration

- **Model**: `Fee` (per service), `Payment` (per application) in `prisma/schema.prisma`
- **Calculation**: `application.service.ts` -> fee calculator with workflow determinant-based adjustments
- **Payment BB**: Mock client in `src/integrations/payment-bb/client.ts`
- **Interface**: `initiatePayment()`, `getPaymentStatus()` — ready for real Payment BB integration

### Reg BB 3.6 — Statistics

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/statistics` | Aggregate statistics across services |

- **Module**: `src/modules/statistics/`
- **Metrics**: Total applications, breakdown by status, breakdown by service, average processing time
