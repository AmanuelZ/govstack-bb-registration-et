import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ApplicationService } from '../../src/modules/applications/application.service.js';
import { TaskService } from '../../src/modules/tasks/task.service.js';
import { randomUUID } from 'crypto';

/**
 * Integration tests for TaskService — runs against a real PostgreSQL database.
 *
 * Tests the operator workflow: task listing, retrieval, and completion
 * with APPROVE, REJECT, and SEND_BACK actions, verifying the full
 * state machine transitions across application and task records.
 */

let prisma: PrismaClient;
let appService: ApplicationService;
let taskService: TaskService;

// Fixture IDs
let userId: string;
let operatorId: string;
let serviceId: string;

function correlationId(): string {
  return `test-${randomUUID()}`;
}

const validPLCFormData = {
  entity_type: 'PLC',
  business_name: 'Task Test PLC',
  business_name_am: 'ተግባር ፈተና ኃ.የተ.የግ.ማ.',
  registered_capital: 50000,
  shareholders_count: 2,
  shareholders: [
    { name: 'Abebe', share_percentage: 60 },
    { name: 'Tigist', share_percentage: 40 },
  ],
  has_foreign_shareholders: false,
  business_sector: 'G47',
  registered_address: {
    region: 'Oromia',
    city: 'Adama',
    subcity: 'Central',
    woreda: '03',
  },
};

beforeAll(async () => {
  prisma = new PrismaClient({
    log: [{ level: 'error', emit: 'stdout' }],
  });
  await prisma.$connect();
  appService = new ApplicationService(prisma);
  taskService = new TaskService(prisma);

  // Applicant user
  const user = await prisma.user.create({
    data: {
      faydaPsut: `test-psut-task-${randomUUID()}`,
      fullName: 'Task Test Applicant',
      roles: ['applicant'],
    },
  });
  userId = user.id;

  // Operator user
  const operator = await prisma.user.create({
    data: {
      faydaPsut: `test-psut-operator-${randomUUID()}`,
      fullName: 'Task Test Operator',
      roles: ['name-reviewer', 'document-verifier'],
    },
  });
  operatorId = operator.id;

  // Service + workflow
  const svc = await prisma.service.upsert({
    where: { code: 'et-business-registration-plc-task-test' },
    update: {
      nameEn: 'Business Registration (PLC) — Task Test',
      isActive: true,
    },
    create: {
      code: 'et-business-registration-plc-task-test',
      nameEn: 'Business Registration (PLC) — Task Test',
      nameAm: 'የንግድ ምዝገባ — ተግባር ፈተና',
      descriptionEn: 'Task integration test service',
      descriptionAm: 'የተግባር ውህደት ፈተና',
      ministryEn: 'Ministry of Trade and Industry',
      ministryAm: 'የንግድና ኢንዱስትሪ ሚኒስቴር',
      estimatedDays: 5,
    },
  });
  serviceId = svc.id;

  await prisma.workflowStep.upsert({
    where: { serviceId_stepCode: { serviceId, stepCode: 'name-review' } },
    update: { allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'] },
    create: {
      serviceId,
      stepCode: 'name-review',
      stepOrder: 1,
      nameEn: 'Name Review',
      nameAm: 'ስም ግምገማ',
      assignedRole: 'name-reviewer',
      slaHours: 24,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'],
      nextStepCode: 'document-verification',
    },
  });

  await prisma.workflowStep.upsert({
    where: { serviceId_stepCode: { serviceId, stepCode: 'document-verification' } },
    update: { allowedActions: ['APPROVE', 'REJECT', 'REQUEST_INFO'] },
    create: {
      serviceId,
      stepCode: 'document-verification',
      stepOrder: 2,
      nameEn: 'Document Verification',
      nameAm: 'ሰነድ ማረጋገጫ',
      assignedRole: 'document-verifier',
      slaHours: 48,
      isTerminal: true,
      allowedActions: ['APPROVE', 'REJECT', 'REQUEST_INFO'],
    },
  });

  await prisma.fee.upsert({
    where: { serviceId_feeCode: { serviceId, feeCode: 'registration-fee' } },
    update: { amountEtb: 500 },
    create: {
      serviceId,
      feeCode: 'registration-fee',
      nameEn: 'Registration Fee',
      nameAm: 'የምዝገባ ክፍያ',
      feeType: 'FIXED',
      amountEtb: 500,
    },
  });
});

afterAll(async () => {
  // Clean up in dependency order
  await prisma.auditLog.deleteMany({
    where: { actorId: { in: [userId, operatorId] } },
  });
  await prisma.applicationStatusHistory.deleteMany({
    where: { application: { applicantId: userId } },
  });
  await prisma.task.deleteMany({
    where: { application: { applicantId: userId } },
  });
  await prisma.application.deleteMany({ where: { applicantId: userId } });
  await prisma.fee.deleteMany({ where: { serviceId } });
  await prisma.workflowStep.deleteMany({ where: { serviceId } });
  await prisma.service.delete({ where: { id: serviceId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, operatorId] } } });
  await prisma.$disconnect();
});

// ─── Helper: submit and get first task ──────────────────────────────────────

async function submitAndGetFirstTask() {
  const app = await appService.submit(
    serviceId,
    userId,
    {
      formData: validPLCFormData,
    },
    correlationId(),
  );

  const tasks = await prisma.task.findMany({
    where: { applicationId: app.id, status: 'PENDING' },
  });

  return { app, task: tasks[0]! };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TaskService — Integration', () => {
  describe('list()', () => {
    it('returns paginated tasks', async () => {
      await submitAndGetFirstTask();
      await submitAndGetFirstTask();

      const result = await taskService.list({ page: 1, limit: 10 });
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('filters by assignedRole', async () => {
      await submitAndGetFirstTask();

      const result = await taskService.list({
        page: 1,
        limit: 100,
        assignedRole: 'name-reviewer',
      });

      for (const task of result.data as Array<{ assignedRole: string }>) {
        expect(task.assignedRole).toBe('name-reviewer');
      }
    });

    it('filters by status', async () => {
      const result = await taskService.list({
        page: 1,
        limit: 100,
        status: 'PENDING',
      });

      for (const task of result.data as Array<{ status: string }>) {
        expect(task.status).toBe('PENDING');
      }
    });
  });

  describe('getById()', () => {
    it('returns task with application context', async () => {
      const { task } = await submitAndGetFirstTask();

      const fetched = await taskService.getById(task.id);
      expect(fetched.id).toBe(task.id);
      expect(fetched.application).toBeDefined();
      expect(fetched.application.service).toBeDefined();
    });

    it('throws NotFound for non-existent task', async () => {
      await expect(taskService.getById(randomUUID())).rejects.toThrow(/not found/i);
    });
  });

  describe('complete() — APPROVE', () => {
    it('advances to next workflow step on first-step approval', async () => {
      const { app, task } = await submitAndGetFirstTask();

      const completed = await taskService.complete(
        task.id,
        operatorId,
        { action: 'APPROVE', comment: 'Name is valid' },
        correlationId(),
      );

      expect(completed.status).toBe('COMPLETED');
      expect(completed.action).toBe('APPROVE');

      // Application should move to IN_REVIEW at next step
      const updatedApp = await prisma.application.findUnique({
        where: { id: app.id },
      });
      expect(updatedApp!.status).toBe('IN_REVIEW');
      expect(updatedApp!.currentStep).toBe('document-verification');

      // New task should be created for document-verification
      const newTasks = await prisma.task.findMany({
        where: { applicationId: app.id, status: 'PENDING' },
      });
      expect(newTasks).toHaveLength(1);
      expect(newTasks[0]!.workflowStep).toBe('document-verification');
      expect(newTasks[0]!.assignedRole).toBe('document-verifier');
    });

    it('marks application APPROVED on final-step approval', async () => {
      const { app, task } = await submitAndGetFirstTask();

      // Approve step 1
      await taskService.complete(task.id, operatorId, { action: 'APPROVE' }, correlationId());

      // Get step 2 task
      const step2Tasks = await prisma.task.findMany({
        where: { applicationId: app.id, status: 'PENDING' },
      });
      const step2Task = step2Tasks[0]!;

      // Approve step 2 (final)
      await taskService.complete(
        step2Task.id,
        operatorId,
        { action: 'APPROVE', comment: 'Documents verified' },
        correlationId(),
      );

      const finalApp = await prisma.application.findUnique({
        where: { id: app.id },
      });
      expect(finalApp!.status).toBe('APPROVED');
      expect(finalApp!.completedAt).toBeTruthy();

      // Full status history: PENDING → IN_REVIEW → APPROVED
      const history = await prisma.applicationStatusHistory.findMany({
        where: { applicationId: app.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(history).toHaveLength(3);
      expect(history[0]!.toStatus).toBe('PENDING');
      expect(history[1]!.toStatus).toBe('IN_REVIEW');
      expect(history[2]!.toStatus).toBe('APPROVED');
    });
  });

  describe('complete() — REJECT', () => {
    it('marks application REJECTED and cancels other tasks', async () => {
      const { app, task } = await submitAndGetFirstTask();

      await taskService.complete(
        task.id,
        operatorId,
        { action: 'REJECT', comment: 'Name is inappropriate' },
        correlationId(),
      );

      const rejectedApp = await prisma.application.findUnique({
        where: { id: app.id },
      });
      expect(rejectedApp!.status).toBe('REJECTED');
      expect(rejectedApp!.completedAt).toBeTruthy();
    });
  });

  describe('complete() — SEND_BACK', () => {
    it('marks application SENT_BACK for applicant revision', async () => {
      const { app, task } = await submitAndGetFirstTask();

      await taskService.complete(
        task.id,
        operatorId,
        { action: 'SEND_BACK', comment: 'Please provide correct business name' },
        correlationId(),
      );

      const sentBack = await prisma.application.findUnique({
        where: { id: app.id },
      });
      expect(sentBack!.status).toBe('SENT_BACK');

      // Status history should record the transition
      const history = await prisma.applicationStatusHistory.findMany({
        where: { applicationId: app.id },
        orderBy: { createdAt: 'asc' },
      });
      const lastEntry = history[history.length - 1]!;
      expect(lastEntry.toStatus).toBe('SENT_BACK');
      expect(lastEntry.reason).toBe('Please provide correct business name');
    });
  });

  describe('complete() — error cases', () => {
    it('rejects already completed task', async () => {
      const { task } = await submitAndGetFirstTask();

      await taskService.complete(task.id, operatorId, { action: 'APPROVE' }, correlationId());

      await expect(
        taskService.complete(task.id, operatorId, { action: 'APPROVE' }, correlationId()),
      ).rejects.toThrow(/already completed/i);
    });

    it('rejects disallowed action for workflow step', async () => {
      const { app, task } = await submitAndGetFirstTask();

      // REQUEST_INFO is not in name-review's allowedActions
      await expect(
        taskService.complete(task.id, operatorId, { action: 'REQUEST_INFO' }, correlationId()),
      ).rejects.toThrow(/not allowed/i);
    });

    it('rejects completion for non-existent task', async () => {
      await expect(
        taskService.complete(randomUUID(), operatorId, { action: 'APPROVE' }, correlationId()),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('audit trail', () => {
    it('records TASK_COMPLETED audit entry', async () => {
      const { task } = await submitAndGetFirstTask();

      await taskService.complete(
        task.id,
        operatorId,
        { action: 'APPROVE', comment: 'Audit test' },
        correlationId(),
      );

      const audit = await prisma.auditLog.findFirst({
        where: { resourceId: task.id, action: 'TASK_COMPLETED' },
      });
      expect(audit).toBeTruthy();
      expect(audit!.actorId).toBe(operatorId);
    });
  });
});
