import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

/**
 * Correlation ID plugin — GovStack CFR requirement.
 * Propagates X-Correlation-Id header through the full request lifecycle.
 * If not provided by caller, generates a new UUID v4.
 */
const correlationPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers['x-correlation-id'];
    request.correlationId =
      typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();

    void reply.header('X-Correlation-Id', request.correlationId);
  });
};

export default fp(correlationPlugin, {
  name: 'correlation',
});
