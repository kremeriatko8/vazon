import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * End-to-end tests boot the real AppModule.
 *
 * - Tests that need no database (test/app.e2e-spec.ts) always run: Prisma
 *   connects lazily, so a placeholder DATABASE_URL is enough.
 * - Tests that need PostgreSQL (for example test/plants.e2e-spec.ts) run only
 *   when E2E_DATABASE_URL is set, and are skipped otherwise. CI always sets it.
 *   The database name must end with "_test": the tests delete all rows.
 */
const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  'postgresql://vazon:vazon@localhost:5440/vazon_test';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Test files share one database, so they must not run at the same time.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      CORS_ORIGINS: 'http://localhost:5180',
      // Fixed test-only value. Never read from .env, never used outside tests.
      JWT_SECRET: 'test-only-secret-not-for-production',
      JWT_EXPIRES_IN: '5m',
      // Photos uploaded by e2e tests go to the system temp folder, not backend/uploads.
      UPLOADS_DIR: join(tmpdir(), 'vazon-e2e-uploads'),
    },
  },
});
