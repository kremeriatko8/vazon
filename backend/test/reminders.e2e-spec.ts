import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

const SECRET = 'test-cron-secret';

/**
 * The reminder endpoint against a real PostgreSQL database. No email is sent:
 * BREVO_API_KEY is not set, so messages are only logged.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)('Reminders endpoint (e2e)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.CRON_SECRET = SECRET;
    delete process.env.BREVO_API_KEY;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await resetDatabase(app.get(PrismaService));
  });

  afterAll(async () => {
    delete process.env.CRON_SECRET;
    await app?.close();
  });

  it('401 without the secret or with a wrong one', async () => {
    await http().post('/api/v1/internal/reminders/run').expect(401);
    await http()
      .post('/api/v1/internal/reminders/run')
      .set('x-cron-secret', 'wrong')
      .expect(401);
  });

  it('runs with the secret and reports a summary', async () => {
    const response = await http()
      .post('/api/v1/internal/reminders/run')
      .set('x-cron-secret', SECRET)
      .expect(200);
    expect(response.body).toEqual({
      checked: 0,
      sent: 0,
      logged: 0,
      skipped: 0,
      failed: 0,
    });
  });
});
