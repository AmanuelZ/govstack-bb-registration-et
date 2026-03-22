import { z } from 'zod';

export const SubmitApplicationSchema = z.object({
  formData: z.record(z.unknown()),
  eFormVersion: z.number().int().min(1).optional().default(1),
});

export const ApplicationParamsSchema = z.object({
  fileId: z.string().uuid(),
});

export const ServiceApplicationParamsSchema = z.object({
  serviceId: z.string().uuid(),
});

export const ApplicationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  serviceId: z.string().uuid().optional(),
  applicantId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SENT_BACK', 'WITHDRAWN', 'EXPIRED']).optional(),
});

export const UpdateApplicationSchema = z.object({
  formData: z.record(z.unknown()).optional(),
  status: z.enum(['WITHDRAWN']).optional(), // Applicants can only withdraw
  comment: z.string().max(2000).optional(),
});

export type SubmitApplicationBody = z.infer<typeof SubmitApplicationSchema>;
export type ApplicationParams = z.infer<typeof ApplicationParamsSchema>;
export type ServiceApplicationParams = z.infer<typeof ServiceApplicationParamsSchema>;
export type ApplicationListQuery = z.infer<typeof ApplicationListQuerySchema>;
export type UpdateApplicationBody = z.infer<typeof UpdateApplicationSchema>;

export const applicationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    fileId: { type: 'string', format: 'uuid' },
    serviceId: { type: 'string', format: 'uuid' },
    applicantId: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SENT_BACK', 'WITHDRAWN', 'EXPIRED'] },
    currentStep: { type: 'string', nullable: true },
    eFormVersion: { type: 'integer' },
    formData: { type: 'object', additionalProperties: true },
    calculatedFees: { type: 'object', additionalProperties: true },
    registryRef: { type: 'string', nullable: true },
    certificateUrl: { type: 'string', nullable: true },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    submittedAt: { type: 'string', format: 'date-time' },
    completedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;
