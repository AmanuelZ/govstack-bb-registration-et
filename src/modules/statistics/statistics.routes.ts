import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPrismaClient } from '../../config/database.js';
import { z } from 'zod';

const StatisticsQuerySchema = z.object({
  serviceId: z.string().uuid().optional(),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
});

export async function statisticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/data/statistics',
    {
      schema: {
        tags: ['Statistics'],
        summary: 'Get operational statistics',
        description:
          'Returns aggregate statistics on applications: counts by status, average processing times, and service breakdown.',
        querystring: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', format: 'uuid' },
            fromDate: { type: 'string', format: 'date-time' },
            toDate: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              generatedAt: { type: 'string', format: 'date-time' },
              period: {
                type: 'object',
                properties: {
                  from: { type: 'string', nullable: true },
                  to: { type: 'string', nullable: true },
                },
              },
              applications: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  byStatus: { type: 'object', additionalProperties: { type: 'integer' } },
                  byService: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        serviceCode: { type: 'string' },
                        serviceNameEn: { type: 'string' },
                        count: { type: 'integer' },
                      },
                    },
                  },
                },
              },
              tasks: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  pending: { type: 'integer' },
                  overdue: { type: 'integer' },
                },
              },
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const prisma = getPrismaClient();
      const query = StatisticsQuerySchema.parse(request.query);

      const dateFilter: { gte?: Date; lte?: Date } = {
        ...(query.fromDate !== undefined && { gte: new Date(query.fromDate) }),
        ...(query.toDate !== undefined && { lte: new Date(query.toDate) }),
      };

      const applicationWhere = {
        ...(query.serviceId !== undefined && { serviceId: query.serviceId }),
        ...(Object.keys(dateFilter).length > 0 && { submittedAt: dateFilter }),
      };

      const [
        totalApplications,
        applicationsByStatus,
        applicationsByService,
        totalTasks,
        pendingTasks,
        overdueTasks,
      ] = await Promise.all([
        prisma.application.count({ where: applicationWhere }),
        prisma.application.groupBy({
          by: ['status'],
          _count: { id: true },
          where: applicationWhere,
        }),
        prisma.application.groupBy({
          by: ['serviceId'],
          _count: { id: true },
          where: applicationWhere,
        }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'PENDING' } }),
        prisma.task.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueAt: { lt: new Date() },
          },
        }),
      ]);

      // Resolve service names for the by-service breakdown
      const serviceIds = applicationsByService.map((r) => r.serviceId);
      const services =
        serviceIds.length > 0
          ? await prisma.service.findMany({
              where: { id: { in: serviceIds } },
              select: { id: true, code: true, nameEn: true },
            })
          : [];
      const serviceMap = new Map(services.map((s) => [s.id, s]));

      const byStatus: Record<string, number> = {};
      for (const row of applicationsByStatus) {
        byStatus[row.status] = row._count.id;
      }

      void reply.send({
        generatedAt: new Date().toISOString(),
        period: {
          from: query.fromDate ?? null,
          to: query.toDate ?? null,
        },
        applications: {
          total: totalApplications,
          byStatus,
          byService: applicationsByService.map((row) => ({
            serviceCode: serviceMap.get(row.serviceId)?.code ?? 'unknown',
            serviceNameEn: serviceMap.get(row.serviceId)?.nameEn ?? 'Unknown',
            count: row._count.id,
          })),
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
        },
      });
    },
  );
}
