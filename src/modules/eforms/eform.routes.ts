import type { FastifyInstance } from 'fastify';
import { listServiceEForms, getEFormById } from './eform.controller.js';
import { eFormSchema } from './eform.schema.js';

export async function eFormRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /services/:serviceId/eForms — mounted at /services/:serviceId/eForms
  fastify.get(
    '/services/:serviceId/eForms',
    {
      schema: {
        tags: ['eForms'],
        summary: 'List e-forms for a service',
        params: {
          type: 'object',
          properties: { serviceId: { type: 'string', format: 'uuid' } },
          required: ['serviceId'],
        },
        response: { 200: { type: 'array', items: eFormSchema } },
        security: [{ BearerAuth: [] }],
      },
    },
    listServiceEForms,
  );

  fastify.get(
    '/eForms/:eFormId',
    {
      schema: {
        tags: ['eForms'],
        summary: 'Get e-form schema by ID',
        description:
          'Returns the full dynamic e-form schema including field definitions, validation rules, and UI rendering hints. Bilingual (English + Amharic).',
        params: {
          type: 'object',
          properties: { eFormId: { type: 'string', format: 'uuid' } },
          required: ['eFormId'],
        },
        response: { 200: eFormSchema },
        security: [{ BearerAuth: [] }],
      },
    },
    getEFormById,
  );
}
