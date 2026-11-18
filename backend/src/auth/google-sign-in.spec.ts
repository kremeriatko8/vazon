import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../app.setup.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type Where = { id?: string; email?: string; googleId?: string };

/** In-memory stand-in for the users table, including google_id. */
function createInMemoryPrisma() {
  const users: StoredUser[] = [];
  const matches = (u: StoredUser, where: Where) =>
    where.id !== undefined
      ? u.id === where.id
      : where.googleId !== undefined
        ? u.googleId === where.googleId
        : u.email === where.email;
  return {
    users,
    user: {
      findUnique: vi.fn(({ where }: { where: Where }) =>
        Promise.resolve(users.find((u) => matches(u, where)) ?? null),
      ),
      create: vi.fn(({ data }: { data: Partial<StoredUser> }) => {
        if (users.some((u) => u.email === data.email)) {
          return Promise.reject(
            Object.assign(new Error('Unique'), { code: 'P2002' }),
          );
        }
        const user: StoredUser = {
          id: `user-${users.length + 1}`,
          email: data.email ?? '',
          passwordHash: data.passwordHash ?? null,
          googleId: data.googleId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(user);
        return Promise.resolve({ ...user });
      }),
      update: vi.fn(
        ({ where, data }: { where: Where; data: Partial<StoredUser> }) => {
          const user = users.find((u) => matches(u, where));
          if (!user) return Promise.reject(new Error('Not found'));
          Object.assign(user, data);
          return Promise.resolve({ ...user });
        },
      ),
    },
  };
}

const FRONTEND = 'http://localhost:5180';
const CALLBACK = 'http://localhost:3100/api/v1/auth/google/callback';

async function createApp(
  prisma: ReturnType<typeof createInMemoryPrisma>,
  google: Record<string, string>,
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          () => ({
            JWT_SECRET: 'google-test-secret',
            CORS_ORIGINS: FRONTEND,
            ...google,
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
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

/** Fakes Google's token and userinfo endpoints. */
function fakeGoogle(
  profile: { sub: string; email: string; email_verified: boolean },
  options: { tokenStatus?: number } = {},
) {
  const realFetch = globalThis.fetch;
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === 'https://oauth2.googleapis.com/token') {
      return Promise.resolve(
        Response.json(
          { access_token: 'google-access-token' },
          { status: options.tokenStatus ?? 200 },
        ),
      );
    }
    if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
      return Promise.resolve(Response.json(profile));
    }
    return realFetch(input, init);
  });
}

function location(response: { headers: Record<string, string> }): URL {
  return new URL(response.headers.location);
}

describe('Google sign-in (HTTP, Prisma and Google mocked)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('not configured', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      app = await createApp(createInMemoryPrisma(), {});
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /auth/google redirects back with google_not_configured', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/google')
        .expect(302);
      const url = location(response);
      expect(url.origin + url.pathname).toBe(`${FRONTEND}/auth/callback`);
      expect(url.searchParams.get('error')).toBe('google_not_configured');
    });
  });

  describe('configured', () => {
    let app: INestApplication<App>;
    let prisma: ReturnType<typeof createInMemoryPrisma>;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
      prisma = createInMemoryPrisma();
      app = await createApp(prisma, {
        GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'client-secret',
        GOOGLE_CALLBACK_URL: CALLBACK,
      });
    });

    afterAll(async () => {
      await app.close();
    });

    /** Starts the flow and returns the state and the cookie to send back. */
    async function start(): Promise<{ state: string; cookie: string }> {
      const response = await http().get('/api/v1/auth/google').expect(302);
      const url = location(response);
      const cookie = (response.headers['set-cookie'] as unknown as string[])[0];
      return {
        state: url.searchParams.get('state') ?? '',
        cookie: cookie.split(';')[0],
      };
    }

    async function finish(code = 'auth-code') {
      const { state, cookie } = await start();
      return http()
        .get('/api/v1/auth/google/callback')
        .query({ code, state })
        .set('Cookie', cookie)
        .expect(302);
    }

    function tokenFrom(response: { headers: Record<string, string> }) {
      const url = location(response);
      expect(url.origin + url.pathname).toBe(`${FRONTEND}/auth/callback`);
      expect(url.search).toBe('');
      return new URLSearchParams(url.hash.slice(1)).get('accessToken') ?? '';
    }

    it('GET /auth/google redirects to Google with the client, callback and a state cookie', async () => {
      const response = await http().get('/api/v1/auth/google').expect(302);
      const url = location(response);
      expect(url.origin + url.pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      expect(url.searchParams.get('client_id')).toBe(
        'client-id.apps.googleusercontent.com',
      );
      expect(url.searchParams.get('redirect_uri')).toBe(CALLBACK);
      expect(url.searchParams.get('scope')).toBe('openid email');
      const state = url.searchParams.get('state') ?? '';
      expect(state.length).toBeGreaterThanOrEqual(32);
      const cookie = (response.headers['set-cookie'] as unknown as string[])[0];
      expect(cookie).toContain(`vazon_google_state=${state}`);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/api/v1/auth/google');
    });

    it('a new Google user gets an account without a password and a working token', async () => {
      fakeGoogle({ sub: 'g-1', email: 'New@Gmail.com', email_verified: true });
      const token = tokenFrom(await finish());

      const me = await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(me.body).toMatchObject({ email: 'new@gmail.com' });
      const stored = prisma.users.find((u) => u.googleId === 'g-1');
      expect(stored?.passwordHash).toBeNull();

      // No password exists, so password login fails like an unknown email.
      await http()
        .post('/api/v1/auth/login')
        .send({ email: 'new@gmail.com', password: 'password123' })
        .expect(401);
    });

    it('signing in again with the same Google account reuses the user', async () => {
      fakeGoogle({
        sub: 'g-2',
        email: 'again@gmail.com',
        email_verified: true,
      });
      await finish();
      await finish();
      expect(prisma.users.filter((u) => u.googleId === 'g-2')).toHaveLength(1);
    });

    it('an existing password account is linked by email and loses its password', async () => {
      await http()
        .post('/api/v1/auth/register')
        .send({ email: 'owner@gmail.com', password: 'password123' })
        .expect(201);
      const before = prisma.users.find((u) => u.email === 'owner@gmail.com');

      fakeGoogle({
        sub: 'g-3',
        email: 'Owner@gmail.com',
        email_verified: true,
      });
      const token = tokenFrom(await finish());
      const me = await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect((me.body as { id: string }).id).toBe(before?.id);
      expect(before?.googleId).toBe('g-3');
      expect(before?.passwordHash).toBeNull();
      await http()
        .post('/api/v1/auth/login')
        .send({ email: 'owner@gmail.com', password: 'password123' })
        .expect(401);
    });

    it.each([
      [
        'unverified Google email',
        { email_verified: false },
        {},
        'email_not_verified',
      ],
      [
        'Google rejects the code',
        {},
        { tokenStatus: 400 },
        'code_exchange_failed',
      ],
    ])(
      '%s: redirects back with an error',
      async (_label, profile, options, error) => {
        fakeGoogle(
          {
            sub: 'g-x',
            email: 'x@gmail.com',
            email_verified: true,
            ...profile,
          },
          options,
        );
        const url = location(await finish());
        expect(url.searchParams.get('error')).toBe(error);
        expect(url.hash).toBe('');
        expect(prisma.users.some((u) => u.googleId === 'g-x')).toBe(false);
      },
    );

    it('rejects a callback without the state cookie or with a different state', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const { state, cookie } = await start();

      const noCookie = await http()
        .get('/api/v1/auth/google/callback')
        .query({ code: 'c', state })
        .expect(302);
      expect(location(noCookie).searchParams.get('error')).toBe(
        'invalid_state',
      );

      const otherState = await http()
        .get('/api/v1/auth/google/callback')
        .query({ code: 'c', state: 'forged' })
        .set('Cookie', cookie)
        .expect(302);
      expect(location(otherState).searchParams.get('error')).toBe(
        'invalid_state',
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('the user cancelling on Google returns access_denied', async () => {
      const { state, cookie } = await start();
      const response = await http()
        .get('/api/v1/auth/google/callback')
        .query({ error: 'access_denied', state })
        .set('Cookie', cookie)
        .expect(302);
      expect(location(response).searchParams.get('error')).toBe(
        'access_denied',
      );
    });
  });
});
