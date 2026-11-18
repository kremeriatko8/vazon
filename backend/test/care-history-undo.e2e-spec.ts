import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasTestDatabase, resetDatabase } from './support/database.js';

interface AuthBody {
  accessToken: string;
}

/**
 * Undo of a care log entry against a real PostgreSQL database.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)('Care history undo (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ownerToken: string;
  let otherToken: string;
  let plantId: string;

  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function signUp(email: string): Promise<string> {
    const credentials = { email, password: 'password123' };
    await http().post('/api/v1/auth/register').send(credentials).expect(201);
    const login = await http()
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);
    return (login.body as AuthBody).accessToken;
  }

  async function logWatering(): Promise<string> {
    const response = await http()
      .post(`/api/v1/plants/${plantId}/care-history`)
      .set(bearer(ownerToken))
      .send({ actionType: 'WATERED', confirm: true })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
    ownerToken = await signUp('undo-owner@example.test');
    otherToken = await signUp('undo-other@example.test');
    const plant = await http()
      .post('/api/v1/plants')
      .set(bearer(ownerToken))
      .send({
        name: 'Pothos',
        species: 'Epipremnum aureum',
        lightCondition: 'MEDIUM',
        potSize: 'SMALL',
        radiatorDistance: 'NONE',
      })
      .expect(201);
    plantId = (plant.body as { id: string }).id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lets the owner undo a fresh entry, which then disappears', async () => {
    const entryId = await logWatering();
    await http()
      .delete(`/api/v1/plants/${plantId}/care-history/${entryId}`)
      .set(bearer(ownerToken))
      .expect(204);
    const list = await http()
      .get(`/api/v1/plants/${plantId}/care-history`)
      .set(bearer(ownerToken))
      .expect(200);
    expect((list.body as { id: string }[]).map((e) => e.id)).not.toContain(
      entryId,
    );
  });

  it('refuses entries older than 24 hours with 409 UNDO_EXPIRED', async () => {
    const entryId = await logWatering();
    await prisma.careHistory.update({
      where: { id: entryId },
      data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });
    const response = await http()
      .delete(`/api/v1/plants/${plantId}/care-history/${entryId}`)
      .set(bearer(ownerToken))
      .expect(409);
    expect((response.body as { code: string }).code).toBe('UNDO_EXPIRED');
  });

  it('returns 404 to another user and for an unknown entry', async () => {
    const entryId = await logWatering();
    await http()
      .delete(`/api/v1/plants/${plantId}/care-history/${entryId}`)
      .set(bearer(otherToken))
      .expect(404);
    await http()
      .delete(
        `/api/v1/plants/${plantId}/care-history/44444444-4444-4444-8444-444444444444`,
      )
      .set(bearer(ownerToken))
      .expect(404);
  });

  it('401 without a token', async () => {
    await http()
      .delete(`/api/v1/plants/${plantId}/care-history/${plantId}`)
      .expect(401);
  });
});
