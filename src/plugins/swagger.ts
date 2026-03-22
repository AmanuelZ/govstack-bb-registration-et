import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

/**
 * OpenAPI 3.0 documentation plugin.
 * Auto-generates spec from Fastify route schemas.
 * Available at /docs (Swagger UI) and /docs/json (raw OpenAPI spec).
 */
const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'GovStack Registration Building Block — Ethiopian Reference Implementation',
        description: `
Ethiopian reference implementation of the GovStack Registration Building Block specification.

Implements three registration workflows:
- **Business Registration (PLC)** — Ministry of Trade new company registration
- **Trade License Renewal** — Annual renewal with Ethiopian fiscal calendar support
- **Manufacturing Permit** — Sector-specific with ESIA environmental clearance

Identity verification via **Fayda/eSignet** (Ethiopia's MOSIP-based national digital ID).
Inter-BB communication via **GovStack Information Mediator** (X-Road compatible).

### Authentication
All endpoints require:
1. **Bearer token** — JWT issued after Fayda/eSignet OIDC login, or API key for service-to-service
2. **Information-Mediator-Client header** — Format: \`INSTANCE/CLASS/MEMBER/SUBSYSTEM\`

### Correlation IDs
All responses include \`X-Correlation-Id\` header for distributed tracing.
        `.trim(),
        version: '0.1.0',
        contact: {
          name: 'Amanuel Zewdu Kebede',
          url: 'https://github.com/AmanuelZ/govstack-bb-registration-et',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      // GovStack extension metadata carried in x-extensions at spec level, not info level
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development',
        },
      ],
      tags: [
        { name: 'Services', description: 'Registration service discovery' },
        { name: 'eForms', description: 'Dynamic e-form schemas' },
        { name: 'Applications', description: 'Application lifecycle management' },
        { name: 'Documents', description: 'Supporting document upload' },
        { name: 'Tasks', description: 'Back-office operator task processing' },
        { name: 'Statistics', description: 'Operational statistics' },
        { name: 'Auth', description: 'Fayda/eSignet OIDC authentication' },
        { name: 'System', description: 'Health and readiness probes' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT issued after Fayda/eSignet OIDC login',
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for service-to-service calls',
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
});

export default swaggerPlugin;
