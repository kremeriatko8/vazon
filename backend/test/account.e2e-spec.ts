import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { MailSender, type MailMessage } from '../src/mail/mail.sender.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

/**
 * Email verification, password reset and account deletion against a real
 * PostgreSQL database. Emails are captured instead of sent.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)('Account API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sent: MailMessage[] = [];
  const email = 'account-owner@example.test';

  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
  const lastToken = () => /token=([A-Za-z0-9_-]+)/.exec(sent.at(-1)!.text)![1];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailSender)
      .useValue({
        send: (message: MailMessage) => {
          sent.push(message);
          return Promise.resolve('logged');
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('verifies the email, resets the password and deletes the account', async () => {
    const reg = await http()
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);
    const token = (reg.body as { accessToken: string }).accessToken;

    const before = await http()
      .get('/api/v1/account')
      .set(bearer(token))
      .expect(200);
    expect(before.body).toMatchObject({
      email,
      emailVerified: false,
      hasPassword: true,
    });

    await http()
      .post('/api/v1/account/email-verification')
      .set(bearer(token))
      .expect(204);
    expect(sent.at(-1)!.to).toBe(email);
    const verifyToken = lastToken();
    await http()
      .post('/api/v1/account/email-verification/confirm')
      .send({ token: verifyToken })
      .expect(204);
    // A link works once.
    const again = await http()
      .post('/api/v1/account/email-verification/confirm')
      .send({ token: verifyToken })
      .expect(400);
    expect((again.body as { code: string }).code).toBe('INVALID_TOKEN');

    const after = await http()
      .get('/api/v1/account')
      .set(bearer(token))
      .expect(200);
    expect((after.body as { emailVerified: boolean }).emailVerified).toBe(true);
    await http()
      .post('/api/v1/account/email-verification')
      .set(bearer(token))
      .expect(409);

    // Unknown address: same answer, no email.
    const count = sent.length;
    await http()
      .post('/api/v1/account/password-reset')
      .send({ email: 'nobody@example.test' })
      .expect(204);
    expect(sent.length).toBe(count);

    await http()
      .post('/api/v1/account/password-reset')
      .send({ email })
      .expect(204);
    await http()
      .post('/api/v1/account/password-reset/confirm')
      .send({ token: lastToken(), password: 'new-password-1' })
      .expect(204);
    await http()
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(401);
    await http()
      .post('/api/v1/auth/login')
      .send({ email, password: 'new-password-1' })
      .expect(200);

    await http()
      .delete('/api/v1/account')
      .set(bearer(token))
      .send({ confirmEmail: 'wrong@example.test' })
      .expect(400);
    await http()
      .delete('/api/v1/account')
      .set(bearer(token))
      .send({ confirmEmail: email })
      .expect(204);
    await http().get('/api/v1/account').set(bearer(token)).expect(401);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });

  it('401 without a token', async () => {
    await http().get('/api/v1/account').expect(401);
    await http().post('/api/v1/account/email-verification').expect(401);
  });
});
