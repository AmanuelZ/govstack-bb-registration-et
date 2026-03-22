import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { config } from './config/index.js';
import { logger } from './common/logger.js';
import { errorHandler } from './common/errors.js';

// Plugins
import correlationPlugin from './common/correlation.js';
import corsPlugin from './plugins/cors.js';
import swaggerPlugin from './plugins/swagger.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import authMiddleware from './integrations/fayda/middleware.js';
import informationMediatorPlugin from './plugins/information-mediator.js';

// Routes
import { healthRoutes } from './modules/health/health.routes.js';
import { serviceRoutes } from './modules/services/service.routes.js';
import { eFormRoutes } from './modules/eforms/eform.routes.js';
import { applicationRoutes } from './modules/applications/application.routes.js';
import { documentRoutes } from './modules/documents/document.routes.js';
import { taskRoutes } from './modules/tasks/task.routes.js';
import { statisticsRoutes } from './modules/statistics/statistics.routes.js';
import { authRoutes } from './plugins/auth.js';

/**
 * Builds and returns the configured Fastify application instance.
 * Exported separately from listen() to allow test harnesses to inject the app without binding a port.
 */
export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
    },
    disableRequestLogging: false,
    requestIdHeader: 'x-correlation-id',
    requestIdLogLabel: 'correlationId',
    genReqId: () => randomUUID(),
  });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Core plugins (order matters)
  await fastify.register(correlationPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(authMiddleware);
  await fastify.register(informationMediatorPlugin);

  // Multipart support for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  });

  // Routes — prefix all under /api/v1
  await fastify.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(healthRoutes);
      await api.register(serviceRoutes, { prefix: '/services' });
      await api.register(eFormRoutes);
      await api.register(applicationRoutes);
      await api.register(documentRoutes);
      await api.register(taskRoutes);
      await api.register(statisticsRoutes);
    },
    { prefix: `/api/${config.apiVersion}` },
  );

  return fastify;
}

/** Start the server */
async function main(): Promise<void> {
  try {
    const app = await buildApp();
    const address = await app.listen({ port: config.port, host: config.host });
    logger.info(
      {
        address,
        env: config.nodeEnv,
        mockFayda: config.mockFaydaEnabled,
        imValidation: config.imValidateClients,
      },
      'GovStack Registration BB server started',
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Only call main() when this file is executed directly, not when imported by tests
const isMain = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMain) {
  void main();
}
