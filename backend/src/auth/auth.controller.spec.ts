import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../app.setup.js';
import type { ErrorResponseBody } from '../common/filters/http-exception.filter.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/** In-memory stand-in for the users table. No database is used. */
function createInMemoryPrisma() {
  const users: StoredUser[] = [];
  return {
    users,
    user: {
      findUnique: vi.fn(
        ({ where }: { where: { id?: string; email?: string } }) =>
          Promise.resolve(
            users.find((u) =>
              where.id ? u.id === where.id : u.email === where.email,
            ) ?? null,
          ),
      ),
      create: vi.fn(
        ({ data }: { data: { email: string; passwordHash: string } }) => {
          if (users.some((u) => u.email === data.email)) {
            return Promise.reject(
              Object.assign(new Error('Unique'), { code: 'P2002' }),
            );
          }
          const user = {
            id: `user-${users.length + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          users.push(user);
          return Promise.resolve(user);
        },
      ),
    },
  };
}

describe('AuthController (HTTP, Prisma mocked)', () => {
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof createInMemoryPrisma>;
  const credentials = { email: 'Owner@Example.com', password: 'password123' };

  beforeAll(async () => {
    prisma = createInMemoryPrisma();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'controller-test-secret',
              CORS_ORIGINS: 'http://localhost:5180',
            }),
          ],
        }),
        PrismaModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('POST /api/v1/auth/register', () => {
    it('201: returns id and lowercased email, never passwordHash', async () => {
      const response = await http()
        .post('/api/v1/auth/register')
        .send(credentials)
        .expect(201);
      expect(response.body).toEqual({
        id: 'user-1',
        email: 'owner@example.com',
      });
      expect(JSON.stringify(response.body)).not.toContain('scrypt');
      expect(prisma.users[0].passwordHash).toMatch(/^scrypt\$/);
    });

    it('409: duplicate email (case-insensitive)', async () => {
      const response = await http()
        .post('/api/v1/auth/register')
        .send({ email: 'OWNER@example.com', password: 'another-pass' })
        .expect(409);
      expect((response.body as ErrorResponseBody).statusCode).toBe(409);
    });

    it.each([
      ['invalid email', { email: 'not-an-email', password: 'password123' }],
      [
        'password shorter than 8',
        { email: 'a@example.com', password: 'short' },
      ],
      [
        'password longer than 72',
        { email: 'a@example.com', password: 'x'.repeat(73) },
      ],
      [
        'unknown field',
        { email: 'a@example.com', password: 'password123', role: 'admin' },
      ],
    ])('400: %s', async (_label, body) => {
      await http().post('/api/v1/auth/register').send(body).expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('200: returns an access token', async () => {
      const response = await http()
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);
      const body = response.body as { accessToken: string };
      expect(Object.keys(body)).toEqual(['accessToken']);
      expect(body.accessToken.split('.')).toHaveLength(3);
    });

    it('401: wrong password and unknown email return the same message', async () => {
      const wrong = await http()
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: 'wrong-password' })
        .expect(401);
      const unknown = await http()
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
      expect((wrong.body as ErrorResponseBody).message).toBe(
        (unknown.body as ErrorResponseBody).message,
      );
    });

    it('400: missing password', async () => {
      await http()
        .post('/api/v1/auth/login')
        .send({ email: credentials.email })
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('401: without a token', async () => {
      const response = await http().get('/api/v1/auth/me').expect(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        path: '/api/v1/auth/me',
      });
    });

    it('401: with an invalid token', async () => {
      await http()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });

    it('401: with a token signed by another secret', async () => {
      const forged = await new JwtService({ secret: 'other-secret' }).signAsync(
        { sub: 'user-1' },
      );
      await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it('401: with a non-Bearer scheme', async () => {
      await http()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Basic abc')
        .expect(401);
    });

    it('200: with a valid token returns id and email', async () => {
      const login = await http()
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);
      const { accessToken } = login.body as { accessToken: string };

      const response = await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body).toEqual({
        id: 'user-1',
        email: 'owner@example.com',
      });
    });
  });
});
