import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

/** Feedback against a real PostgreSQL database. Skipped without E2E_DATABASE_URL. */
describe.skipIf(!hasTestDatabase)('Feedback with PostgreSQL (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());

  async function tokenFor(email: string) {
    const credentials = { email, password: 'password123' };
    const registered = await http()
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201);
    const login = await http()
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);
    return {
      id: (registered.body as { id: string }).id,
      token: (login.body as { accessToken: string }).accessToken,
    };
  }

  it('stores anonymous and signed-in feedback', async () => {
    const anonymous = await http()
      .post('/api/v1/feedback')
      .send({
        category: 'BUG',
        message: 'Login button does nothing',
        page: '/login',
      })
      .expect(201);
    const user = await tokenFor('feedback@example.com');
    const signedIn = await http()
      .post('/api/v1/feedback')
      .set({ Authorization: `Bearer ${user.token}` })
      .send({ category: 'IDEA', message: 'Sort by next watering' })
      .expect(201);

    const rows = await prisma.feedback.findMany({
      where: {
        id: {
          in: [
            (anonymous.body as { id: string }).id,
            (signedIn.body as { id: string }).id,
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    expect(rows.map((r) => r.userId)).toEqual([null, user.id]);
  });

  it('deleting a user keeps their feedback, without the link', async () => {
    const user = await tokenFor('leaving@example.com');
    const sent = await http()
      .post('/api/v1/feedback')
      .set({ Authorization: `Bearer ${user.token}` })
      .send({ category: 'OTHER', message: 'Thanks!' })
      .expect(201);
    await prisma.user.delete({ where: { id: user.id } });

    const row = await prisma.feedback.findUnique({
      where: { id: (sent.body as { id: string }).id },
    });
    expect(row?.userId).toBeNull();
    expect(row?.message).toBe('Thanks!');
  });

  it('a token of a deleted user still lets them send feedback, anonymously', async () => {
    const user = await tokenFor('stale-feedback@example.com');
    await prisma.user.delete({ where: { id: user.id } });
    const sent = await http()
      .post('/api/v1/feedback')
      .set({ Authorization: `Bearer ${user.token}` })
      .send({ category: 'BUG', message: 'Logged out?' })
      .expect(201);
    const row = await prisma.feedback.findUnique({
      where: { id: (sent.body as { id: string }).id },
    });
    expect(row?.userId).toBeNull();
  });
});
