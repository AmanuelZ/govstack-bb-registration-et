import { z } from 'zod';

export const ServiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.coerce.boolean().optional(),
});

export const ServiceParamsSchema = z.object({
  serviceId: z.string().uuid(),
});

// OpenAPI JSON Schema equivalents for Fastify schema decorators
export const serviceSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string' },
    nameEn: { type: 'string' },
    nameAm: { type: 'string' },
    descriptionEn: { type: 'string' },
    descriptionAm: { type: 'string' },
    ministryEn: { type: 'string' },
    ministryAm: { type: 'string' },
    isActive: { type: 'boolean' },
    estimatedDays: { type: 'integer' },
    validityMonths: { type: 'integer', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'code', 'nameEn', 'nameAm', 'descriptionEn', 'descriptionAm', 'ministryEn', 'ministryAm', 'isActive', 'estimatedDays', 'createdAt', 'updatedAt'],
} as const;

export type ServiceListQuery = z.infer<typeof ServiceListQuerySchema>;
export type ServiceParams = z.infer<typeof ServiceParamsSchema>;
