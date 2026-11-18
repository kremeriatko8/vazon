import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Config validation requires DATABASE_URL. The e2e tests never connect,
    // so a placeholder URL is enough and no real database is needed.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://vazon:vazon@localhost:5440/vazon_test',
      CORS_ORIGINS: 'http://localhost:5180',
      // Fixed test-only value. Never read from .env, never used outside tests.
      JWT_SECRET: 'test-only-secret-not-for-production',
    },
  },
});
