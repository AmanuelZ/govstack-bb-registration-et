import type { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import type { PaginatedResponse } from '../../common/types.js';
import type { TaskListQuery, CompleteTaskBody } from './task.schema.js';
import { AuditLogger } from '../../common/audit.js';
import { logger } from '../../common/logger.js';

export class TaskService {
  private readonly audit: AuditLogger;

  constructor(private readonly prisma: PrismaClient) {
    this.audit = new AuditLogger(prisma, logger);
  }

  async list(query: TaskListQuery): Promise<PaginatedResponse<unknown>> {
    const { page, limit, applicationId, assignedRole, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      ...(applicationId !== undefined && { applicationId }),
      ...(assignedRole !== undefined && { assignedRole }),
      ...(status !== undefined && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: {
          application: {
            select: {
              fileId: true,
              status: true,
              service: { select: { nameEn: true, code: true } },
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        application: {
          include: {
            service: true,
            documents: {
              select: {
                id: true,
                documentType: true,
                originalName: true,
                mimeType: true,
                verifiedAt: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw AppError.notFound('Task', taskId);
    }

    return task;
  }

  async complete(
    taskId: string,
    operatorId: string,
    body: CompleteTaskBody,
    correlationId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        application: {
          include: {
            service: {
              include: { workflowSteps: { orderBy: { stepOrder: 'asc' } } },
            },
          },
        },
      },
    });

    if (!task) {
      throw AppError.notFound('Task', taskId);
    }

    if (task.status === 'COMPLETED') {
      throw AppError.unprocessable('Task is already completed');
    }

    const { application } = task;
    const workflowSteps = application.service.workflowSteps;
    const currentStepIndex = workflowSteps.findIndex((s) => s.stepCode === task.workflowStep);
    const currentStep = workflowSteps[currentStepIndex];

    if (!currentStep) {
      throw AppError.unprocessable(`Workflow step '${task.workflowStep}' not found`);
    }

    // Validate action is allowed for this step
    if (!currentStep.allowedActions.includes(body.action)) {
      throw AppError.unprocessable(
        `Action '${body.action}' is not allowed at step '${task.workflowStep}'. Allowed: ${currentStep.allowedActions.join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Complete current task
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: operatorId,
          action: body.action,
          ...(body.comment !== undefined && { comment: body.comment }),
          ...(body.formVariables !== undefined && {
            formVariables: body.formVariables as Prisma.InputJsonValue,
          }),
        },
      });

      let newStatus: string;
      let nextStepCode: string | null = null;

      switch (body.action) {
        case 'APPROVE': {
          const nextStep = workflowSteps[currentStepIndex + 1];
          if (nextStep) {
            // Not the last step — create next task
            newStatus = 'IN_REVIEW';
            nextStepCode = nextStep.stepCode;

            const dueAt = new Date();
            dueAt.setHours(dueAt.getHours() + nextStep.slaHours);

            await tx.task.create({
              data: {
                applicationId: application.id,
                workflowStep: nextStep.stepCode,
                assignedRole: nextStep.assignedRole,
                status: 'PENDING',
                dueAt,
                formVariables: (body.formVariables ?? {}) as Prisma.InputJsonValue,
              },
            });
          } else {
            // Final step — application approved
            newStatus = 'APPROVED';
          }
          break;
        }

        case 'REJECT':
          newStatus = 'REJECTED';
          // Cancel all other open tasks
          await tx.task.updateMany({
            where: {
              applicationId: application.id,
              status: { not: 'COMPLETED' },
              id: { not: taskId },
            },
            data: { status: 'REASSIGNED' },
          });
          break;

        case 'SEND_BACK':
          newStatus = 'SENT_BACK';
          break;

        case 'REQUEST_INFO':
          newStatus = 'IN_REVIEW'; // stays in review, awaiting info
          break;

        default:
          throw AppError.unprocessable(`Unknown action: ${body.action as string}`);
      }

      // Update application
      await tx.application.update({
        where: { id: application.id },
        data: {
          status: newStatus,
          ...(nextStepCode !== null && { currentStep: nextStepCode }),
          ...(newStatus === 'APPROVED' && { completedAt: new Date() }),
          ...(newStatus === 'REJECTED' && { completedAt: new Date() }),
        },
      });

      // Status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: newStatus,
          changedById: operatorId,
          ...(body.comment !== undefined && { reason: body.comment }),
          correlationId,
        },
      });
    });

    await this.audit.record({
      actorId: operatorId,
      action: 'TASK_COMPLETED',
      resourceType: 'Task',
      resourceId: taskId,
      oldValue: { status: task.status, applicationStatus: application.status },
      newValue: { action: body.action },
      correlationId,
    });

    return this.getById(taskId);
  }
}
