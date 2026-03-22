import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors.js';
import type { PaginatedResponse } from '../../common/types.js';
import type { ServiceListQuery } from './service.schema.js';

export type ServiceRecord = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  ministryEn: string;
  ministryAm: string;
  isActive: boolean;
  estimatedDays: number;
  validityMonths: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export class ServiceService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ServiceListQuery): Promise<PaginatedResponse<ServiceRecord>> {
    const { page, limit, isActive } = query;
    const skip = (page - 1) * limit;

    const where = isActive !== undefined ? { isActive } : {};

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nameEn: 'asc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: data as ServiceRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(serviceId: string): Promise<ServiceRecord> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw AppError.notFound('Service', serviceId);
    }

    return service as ServiceRecord;
  }
}
