import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

/** User settings against a real PostgreSQL database. Skipped without E2E_DATABASE_URL. */
describe.skipIf(!hasTestDatabase)('Settings with PostgreSQL (e2e)', () => {
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

  it('defaults, save, read back, and removal with the user', async () => {
    const credentials = {
      email: 'settings@example.com',
      password: 'password123',
    };
    const registered = await http()
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201);
    const login = await http()
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);
    const auth = {
      Authorization: `Bearer ${(login.body as { accessToken: string }).accessToken}`,
    };
    const userId = (registered.body as { id: string }).id;

    const initial = await http()
      .get('/api/v1/me/settings')
      .set(auth)
      .expect(200);
    expect(initial.body).toMatchObject({
      language: 'en',
      reminderTime: '09:00',
    });

    await http()
      .patch('/api/v1/me/settings')
      .set(auth)
      .send({ language: 'uk', remindersEnabled: false })
      .expect(200);
    const saved = await http().get('/api/v1/me/settings').set(auth).expect(200);
    expect(saved.body).toMatchObject({
      language: 'uk',
      remindersEnabled: false,
    });

    await prisma.user.delete({ where: { id: userId } });
    expect(await prisma.userSettings.count({ where: { userId } })).toBe(0);
  });
});
