import { z } from 'zod';

export const TaskParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const TaskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  applicationId: z.string().uuid().optional(),
  assignedRole: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED']).optional(),
});

export const CompleteTaskSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SEND_BACK', 'REQUEST_INFO']),
  comment: z.string().max(2000).optional(),
  formVariables: z.record(z.unknown()).optional(),
});

export type TaskParams = z.infer<typeof TaskParamsSchema>;
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>;
export type CompleteTaskBody = z.infer<typeof CompleteTaskSchema>;

export const taskSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    applicationId: { type: 'string', format: 'uuid' },
    workflowStep: { type: 'string' },
    assignedRole: { type: 'string' },
    assignedToId: { type: 'string', format: 'uuid', nullable: true },
    status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED'] },
    priority: { type: 'integer' },
    dueAt: { type: 'string', format: 'date-time', nullable: true },
    completedAt: { type: 'string', format: 'date-time', nullable: true },
    action: { type: 'string', nullable: true },
    comment: { type: 'string', nullable: true },
    formVariables: { type: 'object', additionalProperties: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;
