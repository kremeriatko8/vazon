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
import { FeedbackModule } from './feedback.module.js';

interface StoredFeedback {
  id: string;
  userId: string | null;
  category: string;
  message: string;
  page: string | null;
  userAgent: string | null;
  createdAt: Date;
}

describe('FeedbackController (HTTP, Prisma mocked)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const stored: StoredFeedback[] = [];
  const prisma = {
    feedback: {
      create: vi.fn(
        ({ data }: { data: Omit<StoredFeedback, 'id' | 'createdAt'> }) => {
          const row = { ...data, id: randomUUID(), createdAt: new Date() };
          stored.push(row);
          return Promise.resolve(row);
        },
      ),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'feedback-test-secret',
              CORS_ORIGINS: 'http://localhost:5180',
            }),
          ],
        }),
        PrismaModule,
        FeedbackModule,
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

  const send = (body: object) =>
    request(app.getHttpServer()).post('/api/v1/feedback').send(body);
  const last = () => stored[stored.length - 1];
  const valid = {
    category: 'IDEA',
    message: '  Add dark mode  ',
    page: '/plants',
  };

  it('201 without a token: stored anonymously, message trimmed, id returned', async () => {
    const response = await send(valid)
      .set('User-Agent', 'TestBrowser/1.0')
      .expect(201);
    expect(Object.keys(response.body as object).sort()).toEqual([
      'createdAt',
      'id',
    ]);
    expect(last()).toMatchObject({
      userId: null,
      category: 'IDEA',
      message: 'Add dark mode',
      page: '/plants',
      userAgent: 'TestBrowser/1.0',
    });
  });

  it('201 with a valid token: linked to the user', async () => {
    const userId = randomUUID();
    const token = await jwt.signAsync({ sub: userId });
    await send(valid).set('Authorization', `Bearer ${token}`).expect(201);
    expect(last()?.userId).toBe(userId);
  });

  it('201 with an expired or forged token: still accepted, anonymously', async () => {
    const expired = await jwt.signAsync(
      { sub: randomUUID() },
      { expiresIn: -10 },
    );
    await send(valid).set('Authorization', `Bearer ${expired}`).expect(201);
    expect(last()?.userId).toBeNull();

    const forged = await new JwtService({ secret: 'other' }).signAsync({
      sub: 'x',
    });
    await send(valid).set('Authorization', `Bearer ${forged}`).expect(201);
    expect(last()?.userId).toBeNull();
  });

  it('201 without the optional page', async () => {
    await send({ category: 'BUG', message: 'Crash' }).expect(201);
    expect(last()?.page).toBeNull();
  });

  it.each([
    ['missing category', { message: 'Hi' }],
    ['unknown category', { category: 'PRAISE', message: 'Hi' }],
    ['missing message', { category: 'BUG' }],
    ['blank message', { category: 'BUG', message: '   ' }],
    [
      'message longer than 2000',
      { category: 'BUG', message: 'x'.repeat(2001) },
    ],
    ['page that is a full URL', { ...valid, page: 'https://evil.example/' }],
    ['page longer than 200', { ...valid, page: `/${'x'.repeat(200)}` }],
    ['userId sent in the body', { ...valid, userId: randomUUID() }],
  ])('400: %s', async (_label, body) => {
    const before = stored.length;
    await send(body).expect(400);
    expect(stored).toHaveLength(before);
  });
});
