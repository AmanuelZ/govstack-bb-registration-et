import type { FastifyInstance } from 'fastify';
import {
  submitApplication,
  listApplications,
  getApplicationByFileId,
  updateApplication,
} from './application.controller.js';
import { applicationSchema } from './application.schema.js';

export async function applicationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/services/:serviceId/applications',
    {
      schema: {
        tags: ['Applications'],
        summary: 'Submit a new application',
        description:
          'Submit a new registration application for a service. Creates the application and generates the first back-office task.',
        params: {
          type: 'object',
          properties: { serviceId: { type: 'string', format: 'uuid' } },
          required: ['serviceId'],
        },
        body: {
          type: 'object',
          required: ['formData'],
          properties: {
            formData: {
              type: 'object',
              additionalProperties: true,
              description: 'Form field values matching the service e-form schema',
            },
            eFormVersion: { type: 'integer', default: 1 },
          },
        },
        response: { 201: applicationSchema },
        security: [{ BearerAuth: [] }],
      },
    },
    submitApplication,
  );

  fastify.get(
    '/applications',
    {
      schema: {
        tags: ['Applications'],
        summary: 'List applications',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
            serviceId: { type: 'string', format: 'uuid' },
            applicantId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: [
                'DRAFT',
                'PENDING',
                'IN_REVIEW',
                'APPROVED',
                'REJECTED',
                'SENT_BACK',
                'WITHDRAWN',
                'EXPIRED',
              ],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array', items: applicationSchema },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    listApplications,
  );

  fastify.get(
    '/applications/:fileId',
    {
      schema: {
        tags: ['Applications'],
        summary: 'Get application by fileId',
        params: {
          type: 'object',
          properties: { fileId: { type: 'string', format: 'uuid' } },
          required: ['fileId'],
        },
        response: { 200: applicationSchema },
        security: [{ BearerAuth: [] }],
      },
    },
    getApplicationByFileId,
  );

  fastify.put(
    '/applications/:fileId',
    {
      schema: {
        tags: ['Applications'],
        summary: 'Update application',
        description:
          'Applicants can update form data on DRAFT/SENT_BACK applications or withdraw any non-terminal application.',
        params: {
          type: 'object',
          properties: { fileId: { type: 'string', format: 'uuid' } },
          required: ['fileId'],
        },
        body: {
          type: 'object',
          properties: {
            formData: { type: 'object', additionalProperties: true },
            status: { type: 'string', enum: ['WITHDRAWN'] },
            comment: { type: 'string', maxLength: 2000 },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    updateApplication,
  );
}
