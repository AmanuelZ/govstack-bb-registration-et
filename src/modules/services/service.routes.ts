import type { FastifyInstance } from 'fastify';
import { listServices, getServiceById } from './service.controller.js';
import { serviceSchema } from './service.schema.js';

const paginatedServiceSchema = {
  type: 'object',
  properties: {
    data: { type: 'array', items: serviceSchema },
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    totalPages: { type: 'integer' },
  },
};

export async function serviceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Services'],
        summary: 'List registration services',
        description:
          'Returns all available registration services. Supports pagination and filtering by active status.',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1, minimum: 1 },
            limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: paginatedServiceSchema,
        },
        security: [{ BearerAuth: [] }],
      },
    },
    listServices,
  );

  fastify.get(
    '/:serviceId',
    {
      schema: {
        tags: ['Services'],
        summary: 'Get service by ID',
        params: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', format: 'uuid' },
          },
          required: ['serviceId'],
        },
        response: {
          200: serviceSchema,
          404: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              correlationId: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    getServiceById,
  );
}
