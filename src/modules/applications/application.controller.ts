import type { FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationService } from './application.service.js';
import {
  SubmitApplicationSchema,
  ServiceApplicationParamsSchema,
  ApplicationParamsSchema,
  ApplicationListQuerySchema,
  UpdateApplicationSchema,
} from './application.schema.js';
import { getPrismaClient } from '../../config/database.js';
import { AppError } from '../../common/errors.js';

const getAppService = () => new ApplicationService(getPrismaClient());

// Extract actor ID from request — set by auth middleware (JWT session or dev X-API-Key)
function getActorId(request: FastifyRequest): string {
  if (request.userId) return request.userId;
  throw AppError.unauthorized('Authentication required');
}

export async function submitApplication(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { serviceId } = ServiceApplicationParamsSchema.parse(request.params);
  const body = SubmitApplicationSchema.parse(request.body);
  const applicantId = getActorId(request);
  const application = await getAppService().submit(serviceId, applicantId, body, request.correlationId);
  void reply.status(201).send(application);
}

export async function listApplications(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = ApplicationListQuerySchema.parse(request.query);
  const result = await getAppService().list(query);
  void reply.send(result);
}

export async function getApplicationByFileId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { fileId } = ApplicationParamsSchema.parse(request.params);
  const application = await getAppService().getByFileId(fileId);
  void reply.send(application);
}

export async function updateApplication(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { fileId } = ApplicationParamsSchema.parse(request.params);
  const body = UpdateApplicationSchema.parse(request.body);
  const actorId = getActorId(request);
  const application = await getAppService().update(fileId, actorId, body, request.correlationId);
  void reply.send(application);
}
