import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

const rateLimitPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => (request.headers['x-api-key'] as string | undefined) ?? request.ip,
    errorResponseBuilder: (request, context) => ({
      code: 'BB-REG-4029',
      message: `Rate limit exceeded. Retry after ${String(context.after)}`,
      correlationId: (request as unknown as { correlationId: string }).correlationId ?? 'unknown',
      timestamp: new Date().toISOString(),
    }),
  });
});

export default rateLimitPlugin;
