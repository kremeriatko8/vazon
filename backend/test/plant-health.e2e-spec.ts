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
 * Plant status and diagnosis against a real PostgreSQL database.
 * Skipped when E2E_DATABASE_URL is not set (see vitest.config.e2e.ts).
 */
describe.skipIf(!hasTestDatabase)('Plant health API (e2e)', () => {
  let app: INestApplication<App>;
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await resetDatabase(app.get(PrismaService));
    ownerToken = await signUp('health-owner@example.test');
    otherToken = await signUp('health-other@example.test');
    const plant = await http()
      .post('/api/v1/plants')
      .set(bearer(ownerToken))
      .send({
        name: 'Fern',
        species: 'Boston fern',
        lightCondition: 'MEDIUM',
        potSize: 'MEDIUM',
        radiatorDistance: 'NEAR',
      })
      .expect(201);
    plantId = (plant.body as { id: string }).id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists symptoms without a token', async () => {
    const response = await http().get('/api/v1/symptoms').expect(200);
    const symptoms = response.body as { code: string; title: { uk: string } }[];
    expect(symptoms.length).toBeGreaterThan(5);
    expect(symptoms[0].title.uk).toBeTruthy();
  });

  it('new plants are HEALTHY', async () => {
    const response = await http()
      .get(`/api/v1/plants/${plantId}`)
      .set(bearer(ownerToken))
      .expect(200);
    expect(response.body).toMatchObject({
      status: 'HEALTHY',
      statusChangedAt: null,
    });
  });

  it('diagnoses brown tips near a radiator as dry air', async () => {
    const response = await http()
      .post(`/api/v1/plants/${plantId}/diagnosis`)
      .set(bearer(ownerToken))
      .send({ symptoms: ['BROWN_TIPS'] })
      .expect(200);
    const body = response.body as {
      causes: { cause: string }[];
      suggestedStatus: string;
    };
    expect(body.causes[0].cause).toBe('DRY_AIR');
    expect(body.suggestedStatus).toBe('NEEDS_ATTENTION');
  });

  it('400 for unknown or empty symptoms', async () => {
    for (const symptoms of [[], ['DANCING'], 'YELLOW_LEAVES']) {
      await http()
        .post(`/api/v1/plants/${plantId}/diagnosis`)
        .set(bearer(ownerToken))
        .send({ symptoms })
        .expect(400);
    }
  });

  it('404 for another user', async () => {
    await http()
      .post(`/api/v1/plants/${plantId}/diagnosis`)
      .set(bearer(otherToken))
      .send({ symptoms: ['WILTING'] })
      .expect(404);
    await http()
      .put(`/api/v1/plants/${plantId}/status`)
      .set(bearer(otherToken))
      .send({ status: 'DEAD' })
      .expect(404);
  });

  it('a dead plant leaves the schedule and refuses new care entries', async () => {
    const response = await http()
      .put(`/api/v1/plants/${plantId}/status`)
      .set(bearer(ownerToken))
      .send({ status: 'DEAD' })
      .expect(200);
    expect(response.body).toMatchObject({ status: 'DEAD' });
    expect(
      (response.body as { statusChangedAt: string }).statusChangedAt,
    ).toMatch(/Z$/);

    const tasks = await http()
      .get('/api/v1/care-tasks')
      .set(bearer(ownerToken))
      .expect(200);
    expect(tasks.body).toEqual([]);

    const log = await http()
      .post(`/api/v1/plants/${plantId}/care-history`)
      .set(bearer(ownerToken))
      .send({ actionType: 'WATERED' })
      .expect(409);
    expect((log.body as { code: string }).code).toBe('PLANT_DEAD');

    await http()
      .put(`/api/v1/plants/${plantId}/status`)
      .set(bearer(ownerToken))
      .send({ status: 'HEALTHY' })
      .expect(200);
  });

  it('400 for an unknown status', async () => {
    await http()
      .put(`/api/v1/plants/${plantId}/status`)
      .set(bearer(ownerToken))
      .send({ status: 'ZOMBIE' })
      .expect(400);
  });
});
