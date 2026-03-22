import { z } from 'zod';

export const EFormParamsSchema = z.object({
  eFormId: z.string().uuid(),
});

export const ServiceEFormsParamsSchema = z.object({
  serviceId: z.string().uuid(),
});

export const eFormSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    serviceId: { type: 'string', format: 'uuid' },
    version: { type: 'integer' },
    titleEn: { type: 'string' },
    titleAm: { type: 'string' },
    schema: { type: 'object', additionalProperties: true },
    uiSchema: { type: 'object', additionalProperties: true },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export type EFormParams = z.infer<typeof EFormParamsSchema>;
export type ServiceEFormsParams = z.infer<typeof ServiceEFormsParamsSchema>;
