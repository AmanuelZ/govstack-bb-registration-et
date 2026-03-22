import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { config } from '../config/index.js';

const corsPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin:
      config.nodeEnv === 'production'
        ? [/\.gov\.et$/, /\.id\.gov\.et$/]
        : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Correlation-Id',
      'Information-Mediator-Client',
    ],
    exposedHeaders: ['X-Correlation-Id'],
    credentials: true,
  });
});

export default corsPlugin;
