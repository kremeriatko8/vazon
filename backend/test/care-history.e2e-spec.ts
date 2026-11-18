import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

/** Response of POST /auth/register and POST /auth/login. */
interface AuthBody {
  accessToken: string;
  user: { id: string; email: string };
}

interface CareLogBody {
  id: string;
  plantId: string;
  careTaskId: string | null;
  actionType: string;
  actionDate: string;
  notes: string | null;
  createdAt: string;
}

/**
 * Care history against a real PostgreSQL database: owner access, 404 for
 * other users, and body validation.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)(
  'Care history API with PostgreSQL (e2e)',
  () => {
    let app: INestApplication<App>;
    let ownerA: { id: string; token: string };
    let userB: { id: string; token: string };
    let plantId: string;

    const http = () => request(app.getHttpServer());
    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

    async function signUp(email: string) {
      const credentials = { email, password: 'password123' };
      await http().post('/api/v1/auth/register').send(credentials).expect(201);
      const login = await http()
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);
      const body = login.body as AuthBody;
      return { id: body.user.id, token: body.accessToken };
    }

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleRef.createNestApplication();
      configureApp(app);
      await app.init();
      await resetDatabase(app.get(PrismaService));

      ownerA = await signUp('care-owner@example.com');
      userB = await signUp('care-other@example.com');
      const plant = await http()
        .post('/api/v1/plants')
        .set(bearer(ownerA.token))
        .send({
          name: 'Care test',
          species: 'Monstera deliciosa',
          lightCondition: 'BRIGHT_INDIRECT',
          potSize: 'MEDIUM',
          radiatorDistance: 'FAR',
        })
        .expect(201);
      plantId = (plant.body as { id: string }).id;
    });

    afterAll(async () => {
      await app?.close();
    });

    it('lets the owner log an action and read it back, newest first', async () => {
      const first = await http()
        .post(`/api/v1/plants/${plantId}/care-history`)
        .set(bearer(ownerA.token))
        .send({ actionType: 'WATERED', notes: '  test note  ' })
        .expect(201);
      const created = first.body as CareLogBody;
      expect(created).toEqual({
        id: expect.any(String) as string,
        plantId,
        careTaskId: null,
        actionType: 'WATERED',
        actionDate: expect.stringMatching(/Z$/) as string,
        notes: 'test note',
        createdAt: expect.stringMatching(/Z$/) as string,
      });

      await http()
        .post(`/api/v1/plants/${plantId}/care-history`)
        .set(bearer(ownerA.token))
        .send({ actionType: 'SOIL_WET' })
        .expect(201);

      const list = await http()
        .get(`/api/v1/plants/${plantId}/care-history`)
        .set(bearer(ownerA.token))
        .expect(200);
      const entries = list.body as CareLogBody[];
      expect(entries.map((e) => e.actionType)).toEqual(['SOIL_WET', 'WATERED']);
      expect(entries[0].notes).toBeNull();

      const all = await http()
        .get('/api/v1/care-history')
        .set(bearer(ownerA.token))
        .expect(200);
      expect((all.body as CareLogBody[]).map((e) => e.id)).toContain(
        created.id,
      );
    });

    it("returns 404 to another user for the owner's plant, on GET and POST", async () => {
      const missing = await http()
        .get('/api/v1/plants/00000000-0000-4000-8000-000000000000/care-history')
        .set(bearer(userB.token))
        .expect(404);

      const get = await http()
        .get(`/api/v1/plants/${plantId}/care-history`)
        .set(bearer(userB.token))
        .expect(404);
      const post = await http()
        .post(`/api/v1/plants/${plantId}/care-history`)
        .set(bearer(userB.token))
        .send({ actionType: 'WATERED' })
        .expect(404);

      // Same message as a plant that does not exist at all.
      const message = (missing.body as { message: string }).message;
      expect((get.body as { message: string }).message).toBe(message);
      expect((post.body as { message: string }).message).toBe(message);
    });

    it("does not include the owner's entries in another user's full history", async () => {
      const response = await http()
        .get('/api/v1/care-history')
        .set(bearer(userB.token))
        .expect(200);
      expect(response.body).toEqual([]);
    });

    it.each([
      ['unknown actionType', { actionType: 'DANCED' }],
      ['DONE (a task status)', { actionType: 'DONE' }],
      ['missing actionType', { notes: 'only a note' }],
      ['notes longer than 500', { actionType: 'FED', notes: 'x'.repeat(501) }],
      [
        'extra field',
        { actionType: 'FED', actionDate: '2026-01-01T00:00:00Z' },
      ],
    ])('400: %s', async (_label, body) => {
      await http()
        .post(`/api/v1/plants/${plantId}/care-history`)
        .set(bearer(ownerA.token))
        .send(body)
        .expect(400);
    });

    it('401 without a token', async () => {
      await http().get(`/api/v1/plants/${plantId}/care-history`).expect(401);
      await http().get('/api/v1/care-history').expect(401);
    });
  },
);
