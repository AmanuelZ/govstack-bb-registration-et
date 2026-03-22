import type { FastifyRequest, FastifyReply } from 'fastify';
import { TaskService } from './task.service.js';
import { TaskParamsSchema, TaskListQuerySchema, CompleteTaskSchema } from './task.schema.js';
import { getPrismaClient } from '../../config/database.js';
import { AppError } from '../../common/errors.js';

const getTaskService = () => new TaskService(getPrismaClient());

// Extract operator ID from request — set by auth middleware (JWT session or dev X-API-Key)
function getOperatorId(request: FastifyRequest): string {
  if (request.userId) return request.userId;
  throw AppError.unauthorized('Authentication required');
}

export async function listTasks(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = TaskListQuerySchema.parse(request.query);
  const result = await getTaskService().list(query);
  void reply.send(result);
}

export async function getTaskById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { taskId } = TaskParamsSchema.parse(request.params);
  const task = await getTaskService().getById(taskId);
  void reply.send(task);
}

export async function completeTask(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { taskId } = TaskParamsSchema.parse(request.params);
  const body = CompleteTaskSchema.parse(request.body);
  const operatorId = getOperatorId(request);
  const task = await getTaskService().complete(taskId, operatorId, body, request.correlationId);
  void reply.send(task);
}
