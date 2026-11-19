import type { PrismaService } from '../../src/prisma/prisma.service.js';

/** True when a real test database is configured (see vitest.config.e2e.ts). */
export const hasTestDatabase = Boolean(process.env.E2E_DATABASE_URL);

/**
 * Deletes every row in the application tables.
 * Refuses to run unless the database name ends with "_test", so it can never
 * wipe a development database by mistake.
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to reset database "${databaseName}": its name must end with "_test".`,
    );
  }
  // users cascades to plants, which cascade to care_tasks and care_history.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE email_tokens, user_settings, feedback, care_history, care_tasks, plants, users RESTART IDENTITY CASCADE',
  );
}
