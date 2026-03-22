import type { FastifyInstance } from 'fastify';
import { listTasks, getTaskById, completeTask } from './task.controller.js';
import { taskSchema } from './task.schema.js';

export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/tasks', {
    schema: {
      tags: ['Tasks'],
      summary: 'List operator tasks',
      description: 'Returns tasks filtered by role, application, or status. Operators should filter by their role.',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          applicationId: { type: 'string', format: 'uuid' },
          assignedRole: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: taskSchema },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
  }, listTasks);

  fastify.get('/tasks/:taskId', {
    schema: {
      tags: ['Tasks'],
      summary: 'Get task by ID',
      description: 'Returns task details with pre-filled form variables and the full application context.',
      params: {
        type: 'object',
        properties: { taskId: { type: 'string', format: 'uuid' } },
        required: ['taskId'],
      },
      response: { 200: taskSchema },
      security: [{ BearerAuth: [] }],
    },
  }, getTaskById);

  fastify.post('/tasks/:taskId/complete', {
    schema: {
      tags: ['Tasks'],
      summary: 'Complete a task',
      description: 'Complete a task with APPROVE, REJECT, SEND_BACK, or REQUEST_INFO. Drives workflow state transitions.',
      params: {
        type: 'object',
        properties: { taskId: { type: 'string', format: 'uuid' } },
        required: ['taskId'],
      },
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', enum: ['APPROVE', 'REJECT', 'SEND_BACK', 'REQUEST_INFO'] },
          comment: { type: 'string', maxLength: 2000 },
          formVariables: { type: 'object', additionalProperties: true },
        },
      },
      response: { 200: taskSchema },
      security: [{ BearerAuth: [] }],
    },
  }, completeTask);
}
