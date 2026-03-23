import type { PrismaClient, Prisma } from '@prisma/client';
import type { Logger } from './logger.js';

export type AuditAction =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_UPDATED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'DOCUMENT_UPLOADED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'USER_AUTHENTICATED'
  | 'PII_ACCESSED'
  | 'ADMIN_ACTION';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  correlationId: string;
}

/**
 * Immutable audit trail — GovStack CFR 5.1.2 compliance.
 * Records all state changes with actor, timestamp, and before/after values.
 */
export class AuditLogger {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          ...(entry.oldValue !== undefined && {
            oldValue: entry.oldValue as Prisma.InputJsonValue,
          }),
          ...(entry.newValue !== undefined && {
            newValue: entry.newValue as Prisma.InputJsonValue,
          }),
          ...(entry.ipAddress !== undefined && { ipAddress: entry.ipAddress }),
          correlationId: entry.correlationId,
        },
      });
    } catch (err) {
      // Audit failures must not break application flow but must be logged
      this.logger.error({ err, entry }, 'Failed to write audit log entry');
    }
  }
}
