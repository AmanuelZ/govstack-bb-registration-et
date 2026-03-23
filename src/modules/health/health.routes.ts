import type { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../../config/database.js';
import { config } from '../../config/index.js';
import { Redis } from 'ioredis';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  correlationId: string;
}

interface ReadyResponse extends HealthResponse {
  checks: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
  };
}

/**
 * Health and readiness probes.
 *
 * GET /api/v1/health — Kubernetes liveness probe. Returns 200 if the process is alive.
 * GET /api/v1/ready  — Kubernetes readiness probe. Returns 200 only if DB + Redis are reachable.
 *
 * These endpoints intentionally skip IM header validation and authentication.
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Reply: HealthResponse }>(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Liveness probe',
        description:
          'Returns 200 if the application process is running. No external dependency checks.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
              version: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              correlationId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        status: 'ok',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        correlationId: request.correlationId,
      });
    },
  );

  fastify.get<{ Reply: ReadyResponse }>(
    '/ready',
    {
      schema: {
        tags: ['System'],
        summary: 'Readiness probe',
        description:
          'Returns 200 only when the database and Redis are reachable. Used for load balancer routing.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              version: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              correlationId: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string', enum: ['ok', 'error'] },
                  redis: { type: 'string', enum: ['ok', 'error'] },
                },
              },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['degraded', 'down'] },
              version: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              correlationId: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string', enum: ['ok', 'error'] },
                  redis: { type: 'string', enum: ['ok', 'error'] },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const prisma = getPrismaClient();
      let dbStatus: 'ok' | 'error' = 'ok';
      let redisStatus: 'ok' | 'error' = 'ok';

      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        dbStatus = 'error';
      }

      try {
        const redis = new Redis(config.redisUrl, { lazyConnect: true, connectTimeout: 3000 });
        await redis.ping();
        await redis.quit();
      } catch {
        redisStatus = 'error';
      }

      const isReady = dbStatus === 'ok' && redisStatus === 'ok';
      const status: ReadyResponse['status'] = isReady
        ? 'ok'
        : dbStatus === 'error' && redisStatus === 'error'
          ? 'down'
          : 'degraded';

      return reply.status(isReady ? 200 : 503).send({
        status,
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        correlationId: request.correlationId,
        checks: { database: dbStatus, redis: redisStatus },
      });
    },
  );
}
