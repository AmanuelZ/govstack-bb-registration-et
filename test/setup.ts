import { beforeAll, afterAll } from 'vitest';
import { getPrismaClient, disconnectPrisma } from '../src/config/database.js';

beforeAll(async () => {
  const prisma = getPrismaClient();
  // Ensure test database schema is up to date.
  // Migrations are run by CI before tests; locally run `npm run db:migrate` first.
  await prisma.$connect();
});

afterAll(async () => {
  await disconnectPrisma();
});
