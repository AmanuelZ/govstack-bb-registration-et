import { PrismaClient } from '@prisma/client';
import { config } from './index.js';
import { logger } from '../common/logger.js';

let prismaInstance: PrismaClient | undefined;

/**
 * Returns a singleton PrismaClient instance.
 * In test environments, creates a fresh instance per test suite to avoid connection pooling issues.
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: { url: config.databaseUrl },
      },
      log:
        config.nodeEnv === 'development'
          ? [
              { level: 'query', emit: 'event' },
              { level: 'warn', emit: 'stdout' },
              { level: 'error', emit: 'stdout' },
            ]
          : [{ level: 'error', emit: 'stdout' }],
    });

    if (config.nodeEnv === 'development') {
      // Type cast needed: Prisma v5 $on types are only available when log is configured with emit:'event'
      const devClient = prismaInstance as PrismaClient & {
        $on(event: 'query', cb: (e: { query: string; params: string; duration: number }) => void): void;
      };
      devClient.$on('query', (e) => {
        logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'DB query');
      });
    }
  }

  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = undefined;
  }
}
