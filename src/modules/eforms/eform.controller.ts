import type { FastifyRequest, FastifyReply } from 'fastify';
import { EFormService } from './eform.service.js';
import { EFormParamsSchema, ServiceEFormsParamsSchema } from './eform.schema.js';
import { getPrismaClient } from '../../config/database.js';

const getEFormService = () => new EFormService(getPrismaClient());

export async function listServiceEForms(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { serviceId } = ServiceEFormsParamsSchema.parse(request.params);
  const eForms = await getEFormService().listForService(serviceId);
  void reply.send(eForms);
}

export async function getEFormById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { eFormId } = EFormParamsSchema.parse(request.params);
  const eForm = await getEFormService().getById(eFormId);
  void reply.send(eForm);
}
