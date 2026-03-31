import type { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import type { PaginatedResponse } from '../../common/types.js';
import type {
  SubmitApplicationBody,
  ApplicationListQuery,
  UpdateApplicationBody,
} from './application.schema.js';
import { AuditLogger } from '../../common/audit.js';
import { logger } from '../../common/logger.js';
import {
  WorkflowEngine,
  buildBusinessRegistrationDeterminants,
  tradeLicenseRenewalDeterminants,
  manufacturingPermitDeterminants,
  validateShareholderCount,
  validateSharePercentages,
  calculateManufacturingPermitFee,
  DEFAULT_REGULATORY_CONFIG,
} from '../../workflows/index.js';
import type { Determinant } from '../../workflows/engine.js';
import type { RegulatoryConfig } from '../../workflows/index.js';

export class ApplicationService {
  private readonly audit: AuditLogger;

  constructor(private readonly prisma: PrismaClient) {
    this.audit = new AuditLogger(prisma, logger);
  }

  async submit(
    serviceId: string,
    applicantId: string,
    body: SubmitApplicationBody,
    correlationId: string,
  ) {
    // Verify service
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      include: {
        workflowSteps: { orderBy: { stepOrder: 'asc' } },
        fees: true,
      },
    });

    if (!service) {
      throw AppError.notFound('Service', serviceId);
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: applicantId } });
    if (!user) {
      throw AppError.notFound('User', applicantId);
    }

    const firstStep = service.workflowSteps[0];
    if (!firstStep) {
      throw AppError.unprocessable('Service has no workflow steps configured');
    }

    // Extract regulatory config from Service.metadata (falls back to Commercial Code defaults)
    const regulatoryConfig = this.extractRegulatoryConfig(service.metadata);

    // Validate against workflow determinants
    const determinants = this.getDeterminants(service.code, regulatoryConfig);
    const evalResult = WorkflowEngine.evaluate(
      determinants,
      body.formData as Record<string, unknown>,
    );
    if (!evalResult.valid) {
      throw AppError.unprocessable('Application data does not meet service requirements', {
        violations: evalResult.violations,
      });
    }

    // Business Registration specific validations
    if (service.code === 'et-business-registration-plc') {
      const formData = body.formData as Record<string, unknown>;
      const entityType = formData['entity_type'] as string | undefined;
      const shareholders = formData['shareholders'] as
        | Array<{ share_percentage: number }>
        | undefined;
      if (entityType && Array.isArray(shareholders)) {
        const countCheck = validateShareholderCount(
          entityType,
          shareholders.length,
          regulatoryConfig,
        );
        if (!countCheck.valid) {
          throw AppError.unprocessable(countCheck.message ?? 'Invalid shareholder count', {
            field: 'shareholders',
            entityType,
            provided: shareholders.length,
          });
        }
        const pctCheck = validateSharePercentages(shareholders);
        if (!pctCheck.valid) {
          throw AppError.unprocessable(pctCheck.message ?? 'Share percentages invalid', {
            field: 'shareholders',
          });
        }
      }
    }

    // Calculate fees
    const calculatedFees = this.calculateFees(
      service.fees,
      body.formData as Record<string, unknown>,
    );

    // Enhanced fee calculation for manufacturing permits
    if (service.code === 'et-manufacturing-permit') {
      const formData = body.formData as Record<string, unknown>;
      const category = formData['environmental_impact_category'] as 'A' | 'B' | 'C' | undefined;
      if (category && (['A', 'B', 'C'] as string[]).includes(category)) {
        const permitFees = calculateManufacturingPermitFee(category);
        Object.assign(calculatedFees, {
          'esia-review-fee': { nameEn: 'ESIA Review Fee', amountEtb: permitFees.esiaReviewFee },
          'application-fee': { nameEn: 'Application Fee', amountEtb: permitFees.applicationFee },
          'inspection-fee': { nameEn: 'Inspection Fee', amountEtb: permitFees.inspectionFee },
        });
      }
    }

    // Create application + first task in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          serviceId,
          applicantId,
          eFormVersion: body.eFormVersion ?? 1,
          status: 'PENDING',
          currentStep: firstStep.stepCode,
          formData: body.formData as Prisma.InputJsonValue,
          calculatedFees: calculatedFees as Prisma.InputJsonValue,
        },
      });

      // First task for the first workflow operator
      const dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + firstStep.slaHours);

      await tx.task.create({
        data: {
          applicationId: application.id,
          workflowStep: firstStep.stepCode,
          assignedRole: firstStep.assignedRole,
          status: 'PENDING',
          dueAt,
          formVariables: body.formData as Prisma.InputJsonValue,
        },
      });

      // Status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          toStatus: 'PENDING',
          changedById: applicantId,
          reason: 'Application submitted',
          correlationId,
        },
      });

      return application;
    });

    await this.audit.record({
      actorId: applicantId,
      action: 'APPLICATION_SUBMITTED',
      resourceType: 'Application',
      resourceId: result.id,
      newValue: { fileId: result.fileId, serviceId, status: 'PENDING' },
      correlationId,
    });

    return result;
  }

  private calculateFees(
    fees: Array<{
      feeCode: string;
      feeType: string;
      amountEtb: unknown;
      formula: string | null;
      nameEn: string;
    }>,
    formData: Record<string, unknown>,
  ): Record<string, { nameEn: string; amountEtb: number }> {
    const result: Record<string, { nameEn: string; amountEtb: number }> = {};

    for (const fee of fees) {
      if (fee.feeType === 'FIXED' && fee.amountEtb !== null) {
        result[fee.feeCode] = {
          nameEn: fee.nameEn,
          amountEtb: Number(fee.amountEtb),
        };
      } else if (fee.feeType === 'CALCULATED' && fee.formula) {
        // Evaluate simple formulas — only safe arithmetic expressions referencing formData fields
        const amount = this.evaluateFormula(fee.formula, formData);
        if (amount !== null) {
          result[fee.feeCode] = { nameEn: fee.nameEn, amountEtb: amount };
        }
      }
    }

    return result;
  }

  private evaluateFormula(formula: string, formData: Record<string, unknown>): number | null {
    // Safe formula evaluator — only handles: field_name * factor, base + (field * factor)
    // Example formula: "500 + (registered_capital * 0.001)"
    try {
      // Replace field references with values from formData
      const resolved = formula.replace(/\b([a-z_][a-z0-9_]*)\b/g, (match) => {
        const val = formData[match];
        return typeof val === 'number' ? String(val) : match;
      });

      // Only allow numeric expressions with basic operators
      if (!/^[\d\s+\-*/().]+$/.test(resolved)) {
        return null;
      }

      return Number(new Function(`return ${resolved}`)());
    } catch {
      return null;
    }
  }

  async list(query: ApplicationListQuery): Promise<PaginatedResponse<unknown>> {
    const { page, limit, serviceId, applicantId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      ...(serviceId !== undefined && { serviceId }),
      ...(applicantId !== undefined && { applicantId }),
      ...(status !== undefined && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          service: { select: { code: true, nameEn: true } },
          applicant: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getByFileId(fileId: string) {
    const application = await this.prisma.application.findUnique({
      where: { fileId },
      include: {
        service: { select: { id: true, code: true, nameEn: true, nameAm: true } },
        applicant: { select: { id: true, fullName: true, fullNameAm: true } },
        documents: {
          select: {
            id: true,
            documentType: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            verifiedAt: true,
            createdAt: true,
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          select: { id: true, workflowStep: true, assignedRole: true, status: true, dueAt: true },
        },
        payments: {
          select: { id: true, feeId: true, amountEtb: true, status: true, paidAt: true },
        },
      },
    });

    if (!application) {
      throw AppError.notFound('Application', fileId);
    }

    return application;
  }

  async update(
    fileId: string,
    actorId: string,
    body: UpdateApplicationBody,
    correlationId: string,
  ) {
    const application = await this.prisma.application.findUnique({ where: { fileId } });
    if (!application) {
      throw AppError.notFound('Application', fileId);
    }

    // Only applicant can update their own application
    if (application.applicantId !== actorId) {
      throw AppError.forbidden('You can only update your own applications');
    }

    // Can only update DRAFT or SENT_BACK applications
    if (!['DRAFT', 'SENT_BACK', 'PENDING'].includes(application.status)) {
      throw AppError.unprocessable(`Cannot update application in status '${application.status}'`);
    }

    const updateData: Prisma.ApplicationUpdateInput = {};

    if (body.formData !== undefined) {
      updateData.formData = body.formData as Prisma.InputJsonValue;
    }

    if (body.status === 'WITHDRAWN') {
      updateData.status = 'WITHDRAWN';
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.application.update({
        where: { id: application.id },
        data: updateData,
      });

      if (body.status === 'WITHDRAWN') {
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: application.status,
            toStatus: 'WITHDRAWN',
            changedById: actorId,
            ...(body.comment !== undefined && { reason: body.comment }),
            correlationId,
          },
        });
      }

      return result;
    });

    await this.audit.record({
      actorId,
      action: 'APPLICATION_UPDATED',
      resourceType: 'Application',
      resourceId: application.id,
      oldValue: { status: application.status },
      newValue: { status: updated.status },
      correlationId,
    });

    return updated;
  }

  private getDeterminants(serviceCode: string, config?: RegulatoryConfig): Determinant[] {
    switch (serviceCode) {
      case 'et-business-registration-plc':
        return buildBusinessRegistrationDeterminants(config);
      case 'et-trade-license-renewal':
        return tradeLicenseRenewalDeterminants;
      case 'et-manufacturing-permit':
        return manufacturingPermitDeterminants;
      default:
        return [];
    }
  }

  private extractRegulatoryConfig(metadata: unknown): RegulatoryConfig {
    if (
      metadata !== null &&
      typeof metadata === 'object' &&
      'regulatoryConfig' in metadata &&
      metadata.regulatoryConfig !== null &&
      typeof metadata.regulatoryConfig === 'object'
    ) {
      const rc = metadata.regulatoryConfig as Record<string, unknown>;
      return {
        capitalRequirements:
          (rc['capitalRequirements'] as Record<string, number> | undefined) ??
          DEFAULT_REGULATORY_CONFIG.capitalRequirements,
        shareholderLimits:
          (rc['shareholderLimits'] as Record<string, { min: number; max?: number }> | undefined) ??
          DEFAULT_REGULATORY_CONFIG.shareholderLimits,
        highCapitalThreshold:
          typeof rc['highCapitalThreshold'] === 'number'
            ? rc['highCapitalThreshold']
            : DEFAULT_REGULATORY_CONFIG.highCapitalThreshold,
        highCapitalSurcharge:
          typeof rc['highCapitalSurcharge'] === 'number'
            ? rc['highCapitalSurcharge']
            : DEFAULT_REGULATORY_CONFIG.highCapitalSurcharge,
      };
    }
    return DEFAULT_REGULATORY_CONFIG;
  }
}
