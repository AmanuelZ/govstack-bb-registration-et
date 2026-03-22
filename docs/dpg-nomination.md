# Digital Public Goods Standard — Compliance Checklist

For nomination to the [Digital Public Goods Alliance](https://digitalpublicgoods.net) registry.

**Project**: govstack-bb-registration-et
**Version**: 0.1.0
**Maintainer**: Amanuel Zewdu Kebede
**Repository**: https://github.com/AmanuelZ/govstack-bb-registration-et

---

## 1. Relevance to Sustainable Development Goals

| SDG | Alignment |
|-----|-----------|
| SDG 16 — Peace, Justice, Strong Institutions | Digitises government registration services, reducing corruption and improving institutional efficiency |
| SDG 8 — Decent Work and Economic Growth | Streamlines business registration, reducing time-to-operate for SMEs |
| SDG 9 — Industry, Innovation, Infrastructure | Provides digital infrastructure for manufacturing permits and industrial licensing |

## 2. Use of Approved Open License

- **License**: MIT (SPDX: `MIT`)
- **File**: [LICENSE](../LICENSE)
- **Verification**: Standard MIT text, no additional restrictions

## 3. Clear Ownership

- **Owner**: Amanuel Zewdu Kebede
- **GitHub**: [@AmanuelZ](https://github.com/AmanuelZ)
- **Location**: Addis Ababa, Ethiopia

## 4. Platform Independence

| Component | Technology | Alternatives |
|-----------|-----------|--------------|
| Runtime | Node.js 18+ | Any platform supporting Node.js |
| Database | PostgreSQL 16 | Any SQL database via Prisma adapter |
| Cache | Redis 7 | Any Redis-compatible store |
| Container | Docker | Any OCI-compatible runtime |
| Orchestration | Kubernetes (Helm) | Docker Compose, Nomad, ECS |

No vendor lock-in. All dependencies are open-source.

## 5. Documentation

| Document | Path |
|----------|------|
| User documentation | [README.md](../README.md) |
| API documentation | Swagger UI at `/docs` (auto-generated OpenAPI 3.0) |
| Architecture | [docs/ethiopian-workflows.md](./ethiopian-workflows.md) |
| Integration guide | [docs/fayda-integration.md](./fayda-integration.md) |
| API examples | [docs/api-examples.md](./api-examples.md) |
| GovStack compliance | [docs/govstack-compliance.md](./govstack-compliance.md) |
| Installation | README Quick Start section |
| Deployment | Helm chart at `helm/registration-bb-et/` |
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) |

## 6. Mechanism for Extracting Non-PII Data

- **REST API**: All data entities accessible via standard REST endpoints
- **Database migrations**: Prisma schema provides version-controlled, portable schema definitions
- **Structured logs**: JSON-formatted logs exportable to any log aggregation system (ELK, Loki, CloudWatch)
- **OpenAPI spec**: Machine-readable API schema at `/docs/json`

## 7. Adherence to Privacy and Applicable Laws

- **Governing law**: Ethiopian Data Protection Proclamation 1038/2011
- **PII encryption**: AES-256-GCM for sensitive fields at rest
- **Identity protection**: Fayda Pairwise Subject Tokens (PSUT) — the system never stores raw national ID numbers
- **Log redaction**: Authorization headers and request bodies excluded from logs
- **Data minimisation**: Only essential identity claims (name, email) stored
- **Privacy policy**: [PRIVACY.md](../PRIVACY.md)

## 8. Adherence to Standards and Best Practices

| Standard | Implementation |
|----------|----------------|
| GovStack Registration BB v2.0 | Full spec compliance (see [govstack-compliance.md](./govstack-compliance.md)) |
| OpenAPI 3.0 | Auto-generated from route schemas |
| ISO 8601 | All timestamps in ISO 8601 format |
| UUID v4 | All entity identifiers |
| Conventional Commits | Commit message format |
| Semantic Versioning | Package version follows SemVer |
| OWASP Top 10 | Input validation, rate limiting, CORS, auth checks |

## 9. Do No Harm Assessment

- **No surveillance**: System does not track user behavior beyond audit trail for regulatory compliance
- **Audit immutability**: Audit log records cannot be modified or deleted after creation
- **Rate limiting**: Prevents system abuse and denial-of-service
- **Access control**: Role-based access ensures operators only see tasks assigned to their role
- **Information Mediator**: Header validation prevents unauthorized cross-system access
- **Data retention**: Aligned with Ethiopian regulatory requirements (10 years for commercial records)

---

## Submission Checklist

- [x] Open-source repository with MIT license
- [x] README with clear project description
- [x] Installation and deployment documentation
- [x] API documentation (OpenAPI/Swagger)
- [x] Privacy policy (PRIVACY.md)
- [x] Code of conduct (CODE_OF_CONDUCT.md)
- [x] Contributing guidelines (CONTRIBUTING.md)
- [x] CI pipeline (GitHub Actions)
- [x] Test suite with coverage reporting
- [x] Helm chart for Kubernetes deployment
- [x] Docker Compose for local development
- [x] GovStack BB specification compliance mapping
