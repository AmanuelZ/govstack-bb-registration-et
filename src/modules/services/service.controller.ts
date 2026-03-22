import type { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceService } from './service.service.js';
import { ServiceListQuerySchema, ServiceParamsSchema } from './service.schema.js';
import { getPrismaClient } from '../../config/database.js';

const getService = () => new ServiceService(getPrismaClient());

export async function listServices(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = ServiceListQuerySchema.parse(request.query);
  const result = await getService().list(query);
  void reply.send(result);
}

export async function getServiceById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { serviceId } = ServiceParamsSchema.parse(request.params);
  const service = await getService().getById(serviceId);
  void reply.send(service);
}
