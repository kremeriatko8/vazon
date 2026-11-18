import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../app.setup.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsModule } from './settings.module.js';

type Row = Record<string, unknown> & { userId: string };

/** In-memory stand-in for the user_settings table, with the schema defaults. */
function createInMemoryPrisma(missingUserId: string) {
  const rows = new Map<string, Row>();
  const defaults = {
    language: 'en',
    remindersEnabled: true,
    reminderTime: '09:00',
    dayBeforeAlert: false,
    emailDigest: true,
  };
  return {
    rows,
    userSettings: {
      findUnique: vi.fn(({ where }: { where: { userId: string } }) =>
        Promise.resolve(rows.get(where.userId) ?? null),
      ),
      upsert: vi.fn(
        ({
          where,
          create,
          update,
        }: {
          where: { userId: string };
          create: Row;
          update: Record<string, unknown>;
        }) => {
          if (where.userId === missingUserId) {
            return Promise.reject(
              Object.assign(new Error('FK'), { code: 'P2003' }),
            );
          }
          const existing = rows.get(where.userId);
          const row = existing
            ? { ...existing, ...update }
            : {
                ...defaults,
                ...create,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
          rows.set(where.userId, row);
          return Promise.resolve({ ...row });
        },
      ),
    },
  };
}

describe('SettingsController (HTTP, Prisma mocked)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const deletedUser = randomUUID();
  const prisma = createInMemoryPrisma(deletedUser);
  const defaults = {
    language: 'en',
    remindersEnabled: true,
    reminderTime: '09:00',
    dayBeforeAlert: false,
    emailDigest: true,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'settings-test-secret',
              CORS_ORIGINS: 'http://localhost:5180',
            }),
          ],
        }),
        PrismaModule,
        SettingsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const as = async (userId: string) => ({
    Authorization: `Bearer ${await jwt.signAsync({ sub: userId })}`,
  });
  const http = () => request(app.getHttpServer());

  it('GET returns the defaults for a new user and does not create a row', async () => {
    const userId = randomUUID();
    await http()
      .get('/api/v1/me/settings')
      .set(await as(userId))
      .expect(200, defaults);
    expect(prisma.rows.has(userId)).toBe(false);
  });

  it('PATCH saves the sent fields; GET then returns them', async () => {
    const userId = randomUUID();
    const headers = await as(userId);
    await http()
      .patch('/api/v1/me/settings')
      .set(headers)
      .send({ language: 'uk', reminderTime: '07:45' })
      .expect(200, { ...defaults, language: 'uk', reminderTime: '07:45' });

    await http()
      .patch('/api/v1/me/settings')
      .set(headers)
      .send({ emailDigest: false })
      .expect(200, {
        ...defaults,
        language: 'uk',
        reminderTime: '07:45',
        emailDigest: false,
      });

    const response = await http()
      .get('/api/v1/me/settings')
      .set(headers)
      .expect(200);
    expect(response.body).toMatchObject({ language: 'uk', emailDigest: false });
    expect(response.body).not.toHaveProperty('userId');
  });

  it('settings are per user', async () => {
    const a = randomUUID();
    const b = randomUUID();
    await http()
      .patch('/api/v1/me/settings')
      .set(await as(a))
      .send({ language: 'uk' })
      .expect(200);
    await http()
      .get('/api/v1/me/settings')
      .set(await as(b))
      .expect(200, defaults);
  });

  it.each([
    ['empty body', {}],
    ['unknown language', { language: 'de' }],
    ['upper-case language', { language: 'UK' }],
    ['time without leading zero', { reminderTime: '9:00' }],
    ['time out of range', { reminderTime: '24:00' }],
    ['time with seconds', { reminderTime: '09:00:00' }],
    ['boolean as string', { remindersEnabled: 'true' }],
    ['null value', { emailDigest: null }],
    ['unknown field', { theme: 'dark' }],
  ])('400: %s', async (_label, body) => {
    await http()
      .patch('/api/v1/me/settings')
      .set(await as(randomUUID()))
      .send(body)
      .expect(400);
  });

  it('401 without a token', async () => {
    await http().get('/api/v1/me/settings').expect(401);
    await http()
      .patch('/api/v1/me/settings')
      .send({ language: 'uk' })
      .expect(401);
  });

  it("401 when the token's user no longer exists", async () => {
    await http()
      .patch('/api/v1/me/settings')
      .set(await as(deletedUser))
      .send({ language: 'uk' })
      .expect(401);
  });
});
