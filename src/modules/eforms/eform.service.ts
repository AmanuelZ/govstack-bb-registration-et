import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors.js';

export class EFormService {
  constructor(private readonly prisma: PrismaClient) {}

  async listForService(serviceId: string) {
    // Verify service exists
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw AppError.notFound('Service', serviceId);
    }

    return this.prisma.eForm.findMany({
      where: { serviceId, isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  async getById(eFormId: string) {
    const eform = await this.prisma.eForm.findUnique({
      where: { id: eFormId },
      include: { service: { select: { id: true, code: true, nameEn: true, nameAm: true } } },
    });

    if (!eform) {
      throw AppError.notFound('EForm', eFormId);
    }

    return eform;
  }
}
