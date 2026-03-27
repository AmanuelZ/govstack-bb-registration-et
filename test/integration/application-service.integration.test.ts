import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ApplicationService } from '../../src/modules/applications/application.service.js';
import { randomUUID } from 'crypto';

/**
 * Integration tests for ApplicationService — runs against a real PostgreSQL database.
 *
 * Prerequisites:
 *   - PostgreSQL running (local: port 5433, CI: docker-compose.test.yml)
 *   - Schema pushed: `npx prisma db push`
 *
 * These tests exercise the full Prisma transaction path: create, read, update,
 * pagination, status transitions, audit log, and status history.
 */

let prisma: PrismaClient;
let service: ApplicationService;

// ─── Fixture IDs (stable across tests) ──────────────────────────────────────

let userId: string;
let serviceId: string;
let firstStepId: string;
let secondStepId: string;
let feeId: string;

// ─── Helpers ────────────────────────────────────────────────────────────────

function correlationId(): string {
  return `test-${randomUUID()}`;
}

const validPLCFormData = {
  entity_type: 'PLC',
  business_name: 'Addis Tech Solutions PLC',
  business_name_am: 'አዲስ ቴክ ሶሉሽንስ ኃ.የተ.የግ.ማ.',
  registered_capital: 50000,
  shareholders_count: 3,
  shareholders: [
    { name: 'Abebe Kebede', share_percentage: 40 },
    { name: 'Tigist Haile', share_percentage: 35 },
    { name: 'Dawit Mengistu', share_percentage: 25 },
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

// ─── Setup & Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  prisma = new PrismaClient({
    log: [{ level: 'error', emit: 'stdout' }],
  });
  await prisma.$connect();
  service = new ApplicationService(prisma);

  // Create test user
  const user = await prisma.user.create({
    data: {
      faydaPsut: `test-psut-${randomUUID()}`,
      fullName: 'Integration Test User',
      fullNameAm: 'የውህደት ፈተና ተጠቃሚ',
      email: 'integration@test.example',
      roles: ['applicant'],
    },
  });
  userId = user.id;

  // Create test service with workflow steps and fee
  const svc = await prisma.service.upsert({
    where: { code: 'et-business-registration-plc' },
    update: {
      nameEn: 'Business Registration (PLC) — Integration Test',
      isActive: true,
    },
    create: {
      code: 'et-business-registration-plc',
      nameEn: 'Business Registration (PLC) — Integration Test',
      nameAm: 'የንግድ ምዝገባ (ኃ.የተ.የግ.ማ.) — ውህደት ፈተና',
      descriptionEn: 'Integration test service for PLC registration',
      descriptionAm: 'የውህደት ፈተና አገልግሎት',
      ministryEn: 'Ministry of Trade and Industry',
      ministryAm: 'የንግድና ኢንዱስትሪ ሚኒስቴር',
      estimatedDays: 5,
      validityMonths: null,
    },
  });
  serviceId = svc.id;

  // Workflow step 1: Name Review
  const step1 = await prisma.workflowStep.upsert({
    where: { serviceId_stepCode: { serviceId, stepCode: 'name-review' } },
    update: { allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'] },
    create: {
      serviceId,
      stepCode: 'name-review',
      stepOrder: 1,
      nameEn: 'Business Name Review',
      nameAm: 'የንግድ ስም ግምገማ',
      assignedRole: 'name-reviewer',
      slaHours: 24,
      allowedActions: ['APPROVE', 'REJECT', 'SEND_BACK'],
      nextStepCode: 'document-verification',
    },
  });
  firstStepId = step1.id;

  // Workflow step 2: Document Verification
  const step2 = await prisma.workflowStep.upsert({
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
  secondStepId = step2.id;

  // Fee: Fixed registration fee
  const fee = await prisma.fee.upsert({
    where: { serviceId_feeCode: { serviceId, feeCode: 'registration-fee' } },
    update: { amountEtb: 500 },
    create: {
      serviceId,
      feeCode: 'registration-fee',
      nameEn: 'Registration Fee',
      nameAm: 'የምዝገባ ክፍያ',
      feeType: 'FIXED',
      amountEtb: 500,
      isRequired: true,
    },
  });
  feeId = fee.id;
});

afterAll(async () => {
  // Clean up in dependency order — delete all records linked to our test service
  await prisma.auditLog.deleteMany({ where: { actorId: userId } });
  await prisma.applicationStatusHistory.deleteMany({
    where: { application: { serviceId } },
  });
  await prisma.task.deleteMany({
    where: { application: { serviceId } },
  });
  await prisma.applicationDocument.deleteMany({
    where: { application: { serviceId } },
  });
  await prisma.payment.deleteMany({
    where: { application: { serviceId } },
  });
  await prisma.application.deleteMany({ where: { serviceId } });
  await prisma.fee.deleteMany({ where: { serviceId } });
  await prisma.workflowStep.deleteMany({ where: { serviceId } });
  await prisma.eForm.deleteMany({ where: { serviceId } });
  await prisma.serviceRole.deleteMany({ where: { serviceId } });
  await prisma.service.delete({ where: { id: serviceId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ApplicationService — Integration', () => {
  describe('submit()', () => {
    it('creates an application with PENDING status and first task', async () => {
      const app = await service.submit(
        serviceId,
        userId,
        {
          formData: validPLCFormData,
        },
        correlationId(),
      );

      expect(app.id).toBeDefined();
      expect(app.fileId).toBeDefined();
      expect(app.status).toBe('PENDING');
      expect(app.currentStep).toBe('name-review');
      expect(app.serviceId).toBe(serviceId);
      expect(app.applicantId).toBe(userId);

      // Verify task was created
      const tasks = await prisma.task.findMany({
        where: { applicationId: app.id },
      });
      expect(tasks).toHaveLength(1);
      expect(tasks[0]!.workflowStep).toBe('name-review');
      expect(tasks[0]!.assignedRole).toContain('name-reviewer');
      expect(tasks[0]!.status).toBe('PENDING');
      expect(tasks[0]!.dueAt).toBeDefined();

      // Verify status history was created
      const history = await prisma.applicationStatusHistory.findMany({
        where: { applicationId: app.id },
      });
      expect(history).toHaveLength(1);
      expect(history[0]!.toStatus).toBe('PENDING');
      expect(history[0]!.fromStatus).toBeNull();

      // Verify audit log was created
      const audit = await prisma.auditLog.findFirst({
        where: { resourceId: app.id, action: 'APPLICATION_SUBMITTED' },
      });
      expect(audit).toBeTruthy();
      expect(audit!.actorId).toBe(userId);
    });

    it('calculates fixed fees from service definition', async () => {
      const app = await service.submit(
        serviceId,
        userId,
        {
          formData: validPLCFormData,
        },
        correlationId(),
      );

      const calculatedFees = app.calculatedFees as Record<
        string,
        { nameEn: string; amountEtb: number }
      >;
      expect(calculatedFees['registration-fee']).toBeDefined();
      expect(calculatedFees['registration-fee']!.amountEtb).toBe(500);
    });

    it('rejects submission with insufficient capital', async () => {
      await expect(
        service.submit(
          serviceId,
          userId,
          {
            formData: { ...validPLCFormData, registered_capital: 5000 },
          },
          correlationId(),
        ),
      ).rejects.toThrow(/does not meet service requirements/);
    });

    it('rejects submission with invalid shareholder percentages', async () => {
      await expect(
        service.submit(
          serviceId,
          userId,
          {
            formData: {
              ...validPLCFormData,
              shareholders: [
                { name: 'A', share_percentage: 40 },
                { name: 'B', share_percentage: 40 },
                { name: 'C', share_percentage: 10 },
              ],
            },
          },
          correlationId(),
        ),
      ).rejects.toThrow(/percentages/i);
    });

    it('rejects submission with too few shareholders for PLC', async () => {
      await expect(
        service.submit(
          serviceId,
          userId,
          {
            formData: {
              ...validPLCFormData,
              shareholders_count: 1,
              shareholders: [{ name: 'Solo', share_percentage: 100 }],
            },
          },
          correlationId(),
        ),
      ).rejects.toThrow(/does not meet|shareholder/i);
    });

    it('rejects submission for non-existent service', async () => {
      await expect(
        service.submit(
          randomUUID(),
          userId,
          {
            formData: validPLCFormData,
          },
          correlationId(),
        ),
      ).rejects.toThrow(/not found/i);
    });

    it('rejects submission for non-existent user', async () => {
      await expect(
        service.submit(
          serviceId,
          randomUUID(),
          {
            formData: validPLCFormData,
          },
          correlationId(),
        ),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('list()', () => {
    it('returns paginated results', async () => {
      // Submit 3 applications
      for (let i = 0; i < 3; i++) {
        await service.submit(
          serviceId,
          userId,
          {
            formData: validPLCFormData,
          },
          correlationId(),
        );
      }

      const result = await service.list({ page: 1, limit: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.limit).toBe(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('filters by applicantId', async () => {
      const result = await service.list({
        page: 1,
        limit: 100,
        applicantId: userId,
      });

      expect(result.total).toBeGreaterThan(0);
      for (const app of result.data as Array<{ applicant: { id: string } }>) {
        expect(app.applicant.id).toBe(userId);
      }
    });

    it('filters by status', async () => {
      const result = await service.list({
        page: 1,
        limit: 100,
        status: 'PENDING',
      });

      for (const app of result.data as Array<{ status: string }>) {
        expect(app.status).toBe('PENDING');
      }
    });

    it('returns empty data for non-matching filters', async () => {
      const result = await service.list({
        page: 1,
        limit: 10,
        applicantId: randomUUID(),
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getByFileId()', () => {
    it('returns full application with relations', async () => {
      const created = await service.submit(
        serviceId,
        userId,
        {
          formData: validPLCFormData,
        },
        correlationId(),
      );

      const app = await service.getByFileId(created.fileId);

      expect(app.id).toBe(created.id);
      expect(app.fileId).toBe(created.fileId);
      expect(app.service.code).toContain('et-business-registration-plc');
      expect(app.applicant.fullName).toBe('Integration Test User');
      expect(app.statusHistory).toHaveLength(1);
      expect(app.tasks).toHaveLength(1);
      expect(app.documents).toHaveLength(0);
      expect(app.payments).toHaveLength(0);
    });

    it('throws NotFound for non-existent fileId', async () => {
      await expect(service.getByFileId(randomUUID())).rejects.toThrow(/not found/i);
    });
  });

  describe('update()', () => {
    it('updates form data on a PENDING application', async () => {
      const app = await service.submit(
        serviceId,
        userId,
        {
          formData: validPLCFormData,
        },
        correlationId(),
      );

      const updatedFormData = { ...validPLCFormData, business_name: 'Updated Name PLC' };
      const updated = await service.update(
        app.fileId,
        userId,
        { formData: updatedFormData },
        correlationId(),
      );

      expect((updated.formData as Record<string, unknown>)['business_name']).toBe(
        'Updated Name PLC',
      );
    });

    it('withdraws a PENDING application', async () => {
      const app = await service.submit(
        serviceId,
        userId,
        {
          formData: validPLCFormData,
        },
        correlationId(),
      );

      const updated = await service.update(
        app.fileId,
        userId,
        { status: 'WITHDRAWN', comment: 'Changed my mind' },
        correlationId(),
      );

      expect(updated.status).toBe('WITHDRAWN');
      expect(updated.completedAt).toBeTruthy();

      // Verify status history includes withdrawal
      const history = await prisma.applicationStatusHistory.findMany({
        where: { applicationId: app.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(history).toHaveLength(2);
      expect(history[1]!.fromStatus).toBe('PENDING');
      expect(history[1]!.toStatus).toBe('WITHDRAWN');
      expect(history[1]!.reason).toBe('Changed my mind');
    });

    it('rejects update by non-owner', async () => {
      const app = await service.submit(
        serviceId,
        userId,
        {
          formData: validPLCFormData,
        },
        correlationId(),
      );

      await expect(
        service.update(app.fileId, randomUUID(), { formData: validPLCFormData }, correlationId()),
      ).rejects.toThrow(/only update your own/i);
    });

    it('rejects update on non-existent application', async () => {
      await expect(
        service.update(randomUUID(), userId, { formData: validPLCFormData }, correlationId()),
      ).rejects.toThrow(/not found/i);
    });
  });
});
